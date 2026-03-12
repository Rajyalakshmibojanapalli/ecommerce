import Coupon from "../models/Coupon.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Create coupon (Admin)
export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(new ApiResponse(201, { coupon }, "Coupon created"));
});

// @desc    Get all coupons (Admin)
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort("-createdAt");
  res.status(200).json(new ApiResponse(200, { coupons }));
});

// @desc    Validate coupon (User)
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon || !coupon.isValid()) {
    throw new ApiError(400, "Invalid or expired coupon");
  }

  if (orderAmount < coupon.minOrderAmount) {
    throw new ApiError(
      400,
      `Minimum order amount is ₹${coupon.minOrderAmount}`
    );
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = Math.round((orderAmount * coupon.discountValue) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.discountValue;
  }

  res.status(200).json(
    new ApiResponse(200, {
      valid: true,
      discount,
      code: coupon.code,
      description: coupon.description,
    })
  );
});

// @desc    Update coupon (Admin)
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  res.status(200).json(new ApiResponse(200, { coupon }, "Coupon updated"));
});

// @desc    Delete coupon (Admin)
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found");
  res.status(200).json(new ApiResponse(200, null, "Coupon deleted"));
});