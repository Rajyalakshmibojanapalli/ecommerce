import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductBySlug,
  getProductById,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
} from "../controllers/productController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);
router.get("/id/:id", getProductById);
router.get("/:id/related", getRelatedProducts);

// Admin
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.array("images", 5),
  createProduct
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.array("images", 5),
  updateProduct
);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;