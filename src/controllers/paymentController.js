import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import envConfig from "../config/envConfig.js";

const razorpay = new Razorpay({
  key_id: envConfig.razorpay.keyId,
  key_secret: envConfig.razorpay.keySecret,
});

// @desc    Create Razorpay order
// @route   POST /api/v1/payments/create-order
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findOne({
    _id: orderId,
    user: req.user._id,
  });

  if (!order) throw new ApiError(404, "Order not found");
  if (order.isPaid) throw new ApiError(400, "Order is already paid");

  const razorpayOrder = await razorpay.orders.create({
    amount: order.totalAmount * 100, // paise
    currency: "INR",
    receipt: order._id.toString(),
  });

  res.status(200).json(
    new ApiResponse(200, {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: envConfig.razorpay.keyId,
    })
  );
});

// @desc    Verify payment
// @route   POST /api/v1/payments/verify
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", envConfig.razorpay.keySecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed");
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  order.isPaid = true;
  order.paidAt = Date.now();
  order.status = "Processing";
  order.paymentResult = {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    status: "completed",
  };
  order.statusHistory.push({
    status: "Processing",
    note: "Payment received",
  });

  await order.save();

  res
    .status(200)
    .json(new ApiResponse(200, { order }, "Payment verified successfully"));
});

// @desc    Get Razorpay key
// @route   GET /api/v1/payments/key
export const getRazorpayKey = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, { key: envConfig.razorpay.keyId })
  );
});