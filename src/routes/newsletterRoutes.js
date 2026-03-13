// routes/newsletterRoutes.js
import { Router } from "express";
import { protect, authorize  } from "../middlewares/authMiddleware.js";
import {
  subscribe,
  unsubscribe,
  getAllSubscribers,
  deleteSubscriber,
} from "../controllers/newsletterController.js";

const router = Router();

router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);

// admin
router.get("/", protect, authorize("admin"), getAllSubscribers);
router.delete("/:id", protect, authorize("admin"), deleteSubscriber);

export default router;