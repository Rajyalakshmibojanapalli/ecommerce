import Category from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  uploadCategoryImage,
  deleteFromS3,
  presignCategoryImage,
  presignCategoryList,
} from "../services/s3Service.js";

// @desc    Create category (Admin)
export const createCategory = asyncHandler(async (req, res) => {
  if (req.file) {
    try {
      const image = await uploadCategoryImage(req.file);
      req.body.image = image;
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Upload failed: " + err.message,
      });
    }
  }

  const category = await Category.create(req.body);
  const presigned = await presignCategoryImage(category);

  return res.created({ category: presigned }, "Category created");
});

// @desc    Get all categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ parent: null, isActive: true })
    .populate({ path: "subcategories", match: { isActive: true } })
    .lean();

  // ✅ Presign all category images
  const presigned = await presignCategoryList(categories);

  // Also presign subcategory images
  for (const cat of presigned) {
    if (cat.subcategories && cat.subcategories.length > 0) {
      cat.subcategories = await presignCategoryList(cat.subcategories);
    }
  }

  return res.success({ categories: presigned });
});

// @desc    Get single category
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug })
    .populate("subcategories");

  if (!category) return res.notFound("Category not found");

  const presigned = await presignCategoryImage(category);

  return res.success({ category: presigned });
});

// @desc    Update category (Admin)
export const updateCategory = asyncHandler(async (req, res) => {
  let category = await Category.findById(req.params.id);
  if (!category) return res.notFound("Category not found");

  if (req.file) {
    if (category.image?.key) {
      await deleteFromS3(category.image.key);
    }
    try {
      req.body.image = await uploadCategoryImage(req.file);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Upload failed: " + err.message,
      });
    }
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  const presigned = await presignCategoryImage(category);

  return res.success({ category: presigned }, "Category updated");
});

// @desc    Delete category (Admin)
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.notFound("Category not found");

  if (category.image?.key) {
    await deleteFromS3(category.image.key);
  }

  await Category.findByIdAndDelete(req.params.id);
  return res.noContent("Category deleted");
});