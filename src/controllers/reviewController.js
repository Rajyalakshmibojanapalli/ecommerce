import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Create review
export const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // Check if user purchased the product
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    "orderItems.product": productId,
    status: "Delivered",
  });

  if (!hasPurchased) {
    throw new ApiError(400, "You can only review products you have purchased");
  }

  // Check if already reviewed
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId,
  });

  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this product");
  }

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    title,
    comment,
  });

  res.status(201).json(new ApiResponse(201, { review }, "Review added"));
});

// @desc    Get reviews for product
export const getProductReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const total = await Review.countDocuments({ product: req.params.productId });

  const reviews = await Review.find({ product: req.params.productId })
    .populate("user", "name avatar")
    .sort("-createdAt")
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json(
    new ApiResponse(200, {
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalReviews: total,
      },
    })
  );
});

// @desc    Delete review
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found");

  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Not authorized");
  }

  await Review.findByIdAndDelete(req.params.id);

  res.status(200).json(new ApiResponse(200, null, "Review deleted"));
});