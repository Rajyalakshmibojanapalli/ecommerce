import { Router } from "express";
import {
  createCategory,
  getCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/", getCategories);
router.get("/:slug", getCategoryBySlug);

// Admin
router.post("/", protect, authorize("admin"), upload.single("image"), createCategory);
router.put("/:id", protect, authorize("admin"), upload.single("image"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

export default router;