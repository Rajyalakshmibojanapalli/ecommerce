// routes/bannerRoutes.js
import { Router } from "express";
import { protect, admin } from "../middleware/auth.js";
import {
  getBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "../controllers/bannerController.js";

const router = Router();

router.get("/", getBanners);

// admin
router.get("/all", protect, admin, getAllBanners);
router.post("/", protect, admin, createBanner);
router
  .route("/:id")
  .put(protect, admin, updateBanner)
  .delete(protect, admin, deleteBanner);

export default router;