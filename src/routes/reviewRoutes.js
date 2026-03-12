import { Router } from "express";
import {
  createReview,
  getProductReviews,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", protect, createReview);
router.get("/product/:productId", getProductReviews);
router.delete("/:id", protect, deleteReview);

export default router;