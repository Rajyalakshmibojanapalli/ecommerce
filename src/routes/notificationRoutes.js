// routes/notificationRoutes.js
import { Router } from "express";
import { protect, admin } from "../middleware/auth.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
  broadcastNotification,
} from "../controllers/notificationController.js";

const router = Router();

router.use(protect);

router.route("/").get(getNotifications).delete(clearAll);
router.put("/read-all", markAllAsRead);
router.route("/:id").delete(deleteNotification);
router.put("/:id/read", markAsRead);

// admin
router.post("/admin/broadcast", admin, broadcastNotification);

export default router;