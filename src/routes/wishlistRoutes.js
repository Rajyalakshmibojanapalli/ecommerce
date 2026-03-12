// routes/wishlistRoutes.js
import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart,
} from "../controllers/wishlistController.js";

const router = Router();

router.use(protect);

router.route("/").get(getWishlist).delete(clearWishlist);
router.route("/:productId").post(addToWishlist).delete(removeFromWishlist);
router.post("/:productId/move-to-cart", moveToCart);

export default router;