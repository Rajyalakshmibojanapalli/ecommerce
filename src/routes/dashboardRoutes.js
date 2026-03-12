import { Router } from "express";
import {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
} from "../controllers/dashboardController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id/toggle-status", toggleUserStatus);

export default router;