import { Router } from "express";
import {
  createRazorpayOrder,
  verifyPayment,
  getRazorpayKey,
} from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/key", getRazorpayKey);
router.post("/create-order", createRazorpayOrder);
router.post("/verify", verifyPayment);

export default router;