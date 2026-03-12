// routes/newsletterRoutes.js
import { Router } from "express";
import { protect, admin } from "../middleware/auth.js";
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
router.get("/", protect, admin, getAllSubscribers);
router.delete("/:id", protect, admin, deleteSubscriber);

export default router;