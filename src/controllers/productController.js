import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  uploadProductImages,
  deleteMultipleFromS3,
  presignProductImages,
  presignProductList,
} from "../services/s3Service.js";

// @desc    Create product (Admin)
export const createProduct = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;

  if (req.files && req.files.length > 0) {
    console.log("FILES:", req.files.map((f) => f.originalname));

    let images;
    try {
      images = await uploadProductImages(req.files);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Upload failed: " + err.message,
        error: err.name,
      });
    }
    req.body.images = images; // Stored as raw S3 URLs
  }

  const product = await Product.create(req.body);

  // ✅ Convert to presigned URLs before sending
  const presigned = await presignProductImages(product);

  return res.created({ product: presigned }, "Product created successfully");
});

// @desc    Get all products
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12, sort = "-createdAt",
    search, category, brand, minPrice, maxPrice, rating, featured,
  } = req.query;

  const query = { isActive: true };
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (brand) query.brand = { $regex: brand, $options: "i" };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (rating) query.ratingsAverage = { $gte: Number(rating) };
  if (featured === "true") query.isFeatured = true;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);

  const products = await Product.find(query)
    .populate("category", "name slug")
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // ✅ Convert all product images to presigned URLs
  const presigned = await presignProductList(products);

  return res.paginated(
    { products: presigned },
    { page: Number(page), limit: Number(limit), total },
    "Products fetched"
  );
});

// @desc    Get single product by slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("category", "name slug")
    .populate({
      path: "reviews",
      populate: { path: "user", select: "name avatar" },
      options: { sort: { createdAt: -1 }, limit: 10 },
    });

  if (!product) return res.notFound("Product not found");

  // ✅ Presign product images
  const presigned = await presignProductImages(product);

  // ✅ Also presign reviewer avatars
  if (presigned.reviews) {
    for (let i = 0; i < presigned.reviews.length; i++) {
      const review = presigned.reviews[i];
      if (review.user?.avatar?.url) {
        const { generatePresignedUrl } = await import("../services/s3Service.js");
        review.user.avatar.url = await generatePresignedUrl(review.user.avatar.url);
      }
    }
  }

  return res.success({ product: presigned });
});

// @desc    Get product by ID
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug");

  if (!product) return res.notFound("Product not found");

  const presigned = await presignProductImages(product);

  return res.success({ product: presigned });
});

// @desc    Update product (Admin)
export const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) return res.notFound("Product not found");

  if (req.files && req.files.length > 0) {
    // Delete old images
    await deleteMultipleFromS3(product.images);

    try {
      req.body.images = await uploadProductImages(req.files);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Upload failed: " + err.message,
      });
    }
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  const presigned = await presignProductImages(product);

  return res.success({ product: presigned }, "Product updated");
});

// @desc    Delete product (Admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.notFound("Product not found");

  await deleteMultipleFromS3(product.images);
  await Product.findByIdAndDelete(req.params.id);

  return res.noContent("Product deleted");
});

// @desc    Get related products
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.notFound("Product not found");

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  }).limit(8).lean();

  const presigned = await presignProductList(related);

  return res.success({ products: presigned });
});