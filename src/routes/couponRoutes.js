import { Router } from "express";
import {
  createCoupon,
  getCoupons,
  validateCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/validate", protect, validateCoupon);

// Admin
router.use(protect, authorize("admin"));
router.route("/").get(getCoupons).post(createCoupon);
router.route("/:id").put(updateCoupon).delete(deleteCoupon);

export default router;