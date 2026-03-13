import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendOrderConfirmation } from "../services/emailService.js";

// @desc    Create order
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, couponCode } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return res.badRequest("Cart is empty");
  }

  // Validate stock & build order items
  const orderItems = [];
  let itemsPrice = 0;

  for (const item of cart.items) {
    const product = item.product;

    if (!product.isActive) {
      return res.badRequest(`${product.name} is no longer available`);
    }
    if (product.stock < item.quantity) {
      return res.badRequest(`Insufficient stock for ${product.name}`);
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || product.images[0] || "",
      price: product.price,
      quantity: item.quantity,
    });

    itemsPrice += product.price * item.quantity;
  }

  // Calculate prices
  const taxPrice = Math.round(itemsPrice * 0.18);
  const shippingPrice = itemsPrice > 500 ? 0 : 50;
  let discountAmount = 0;
  let couponData = {};

  // Apply coupon
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

    if (!coupon || !coupon.isValid()) {
      return res.badRequest("Invalid or expired coupon");
    }

    if (itemsPrice < coupon.minOrderAmount) {
      return res.badRequest(`Min order amount for this coupon is ₹${coupon.minOrderAmount}`);
    }

    const userUsage = coupon.usedBy.find(
      (u) => u.user.toString() === req.user._id.toString()
    );
    if (userUsage && userUsage.count >= coupon.perUserLimit) {
      return res.badRequest("Coupon usage limit reached");
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

    if (userUsage) {
      userUsage.count += 1;
    } else {
      coupon.usedBy.push({ user: req.user._id, count: 1 });
    }
    coupon.usedCount += 1;
    await coupon.save();
  }

  const totalAmount = itemsPrice + taxPrice + shippingPrice - discountAmount;

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
    isPaid: false,
    status: paymentMethod === "COD" ? "Processing" : "Pending",
    statusHistory: [{
      status: paymentMethod === "COD" ? "Processing" : "Pending",
      note: "Order placed",
    }],
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

  // ✅ FIX: Pass email string, not user object
  sendOrderConfirmation(req.user.email, order).catch(console.error);

  return res.created({ order }, "Order placed successfully");
});

// @desc    Get my orders
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

  return res.paginated(
    { orders },
    { page: Number(page), limit: Number(limit), total },
    "Orders fetched"
  );
});

// @desc    Get order by ID
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("orderItems.product", "name slug images");

  if (!order) return res.notFound("Order not found");

  // Check ownership (unless admin)
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role?.toLowerCase() !== "admin"
  ) {
    return res.forbidden("Not authorized to view this order");
  }

  return res.success({ order });
});

// @desc    Cancel order (User)
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!order) return res.notFound("Order not found");

  if (!["Pending", "Processing", "Confirmed"].includes(order.status)) {
    return res.badRequest("Order cannot be cancelled at this stage");
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

  return res.success({ order }, "Order cancelled successfully");
});

// ============= ADMIN =============

// @desc    Get all orders (Admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

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

  return res.paginated(
    { orders },
    { page: Number(page), limit: Number(limit), total },
    "Orders fetched"
  );
});

// @desc    Update order status (Admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) return res.notFound("Order not found");

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

  return res.success({ order }, "Order status updated");
});