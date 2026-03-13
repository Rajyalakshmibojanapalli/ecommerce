import { Router } from "express";
import {
  updateProfile,
  updateAvatar,
  changePassword,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import validate from "../middlewares/validate.js";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/authValidator.js";

const router = Router();

router.use(protect);

router.put("/profile", validate(updateProfileSchema), updateProfile);
router.put("/avatar", upload.single("avatar"), updateAvatar);
router.put("/change-password", validate(changePasswordSchema), changePassword);

// Address
router.route("/addresses").get(getAddresses).post(addAddress);
router.route("/addresses/:id").put(updateAddress).delete(deleteAddress);

// Wishlist
// router.get("/wishlist", getWishlist);
// router.post("/wishlist/:productId", toggleWishlist);

export default router;