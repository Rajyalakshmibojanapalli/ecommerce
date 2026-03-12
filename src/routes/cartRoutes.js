import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);

router.route("/").get(getCart).post(addToCart).delete(clearCart);
router.route("/:productId").put(updateCartItem).delete(removeFromCart);

export default router;