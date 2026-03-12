import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../validators/orderValidator.js";

const router = Router();

router.use(protect);

router.post("/", validate(createOrderSchema), createOrder);
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);
router.put("/:id/cancel", cancelOrder);

// Admin
router.get("/admin/all", authorize("admin"), getAllOrders);
router.put(
  "/:id/status",
  authorize("admin"),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;