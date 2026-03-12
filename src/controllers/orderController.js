import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendOrderConfirmation } from "../services/emailService.js";

// @desc    Create order
// @route   POST /api/v1/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, couponCode } = req.body;

  // Get cart
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  // Validate stock & build order items
  const orderItems = [];
  let itemsPrice = 0;

  for (const item of cart.items) {
    const product = item.product;

    if (!product.isActive) {
      throw new ApiError(400, `${product.name} is no longer available`);
    }
    if (product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || "",
      price: product.price,
      quantity: item.quantity,
    });

    itemsPrice += product.price * item.quantity;
  }

  // Calculate prices
  const taxPrice = Math.round(itemsPrice * 0.18); // 18% GST
  const shippingPrice = itemsPrice > 500 ? 0 : 50; // Free shipping over ₹500
  let discountAmount = 0;
  let couponData = {};

  // Apply coupon
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
    });

    if (!coupon || !coupon.isValid()) {
      throw new ApiError(400, "Invalid or expired coupon");
    }

    if (itemsPrice < coupon.minOrderAmount) {
      throw new ApiError(
        400,
        `Min order amount for this coupon is ₹${coupon.minOrderAmount}`
      );
    }

    // Check per user limit
    const userUsage = coupon.usedBy.find(
      (u) => u.user.toString() === req.user._id.toString()
    );
    if (userUsage && userUsage.count >= coupon.perUserLimit) {
      throw new ApiError(400, "Coupon usage limit reached");
    }

    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((itemsPrice * coupon.discountValue) / 100);
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    couponData = { code: coupon.code, discount: discountAmount };

    // Update coupon usage
    if (userUsage) {
      userUsage.count += 1;
    } else {
      coupon.usedBy.push({ user: req.user._id, count: 1 });
    }
    coupon.usedCount += 1;
    await coupon.save();
  }

  const totalAmount = itemsPrice + taxPrice + shippingPrice - discountAmount;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    discountAmount,
    totalAmount,
    coupon: couponData,
    isPaid: paymentMethod === "COD" ? false : false,
    status: paymentMethod === "COD" ? "Processing" : "Pending",
    statusHistory: [
      {
        status: paymentMethod === "COD" ? "Processing" : "Pending",
        note: "Order placed",
      },
    ],
  });

  // Update product stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity, totalSold: item.quantity },
    });
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  // Send email
  sendOrderConfirmation(req.user, order).catch(console.error);

  res
    .status(201)
    .json(new ApiResponse(201, { order }, "Order placed successfully"));
});

// @desc    Get my orders
// @route   GET /api/v1/orders/my-orders
export const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { user: req.user._id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .sort("-createdAt")
    .skip(skip)
    .limit(Number(limit))
    .lean();

  res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalOrders: total,
      },
    })
  );
});

// @desc    Get order by ID
// @route   GET /api/v1/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("orderItems.product", "name slug images");

  if (!order) throw new ApiError(404, "Order not found");

  // Check ownership (unless admin)
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Not authorized to view this order");
  }

  res.status(200).json(new ApiResponse(200, { order }));
});

// @desc    Cancel order (User)
// @route   PUT /api/v1/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!order) throw new ApiError(404, "Order not found");

  if (!["Pending", "Processing", "Confirmed"].includes(order.status)) {
    throw new ApiError(400, "Order cannot be cancelled at this stage");
  }

  order.status = "Cancelled";
  order.cancelledAt = Date.now();
  order.cancelReason = req.body.reason || "Cancelled by user";
  order.statusHistory.push({
    status: "Cancelled",
    note: req.body.reason || "Cancelled by user",
  });

  // Restore stock
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, totalSold: -item.quantity },
    });
  }

  await order.save();

  res
    .status(200)
    .json(new ApiResponse(200, { order }, "Order cancelled successfully"));
});

// ============= ADMIN =============

// @desc    Get all orders (Admin)
// @route   GET /api/v1/orders/admin/all
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;

  const query = {};
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .populate("user", "name email")
    .sort("-createdAt")
    .skip(skip)
    .limit(Number(limit))
    .lean();

  res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalOrders: total,
      },
    })
  );
});

// @desc    Update order status (Admin)
// @route   PUT /api/v1/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) throw new ApiError(404, "Order not found");

  order.status = status;
  order.statusHistory.push({
    status,
    note: req.body.note || `Status updated to ${status}`,
  });

  if (status === "Delivered") {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.deliveredAt = Date.now();
  }

  if (status === "Shipped" && req.body.trackingId) {
    order.trackingId = req.body.trackingId;
  }

  await order.save();

  res
    .status(200)
    .json(new ApiResponse(200, { order }, "Order status updated"));
});