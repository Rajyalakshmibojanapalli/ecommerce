// routes/bannerRoutes.js
import { Router } from "express";
import { protect, authorize  } from "../middlewares/authMiddleware.js";
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
router.get("/all", protect, authorize("admin"), getAllBanners);
router.post("/", protect, authorize("admin"), createBanner);
router
  .route("/:id")
  .put(protect, authorize("admin"), updateBanner)
  .delete(protect, authorize("admin"), deleteBanner);

export default router;