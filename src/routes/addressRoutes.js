// routes/addressRoutes.js
import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefault,
} from "../controllers/addressController.js";

const router = Router();

router.use(protect);

router.route("/").get(getAddresses).post(addAddress);
router.route("/:id").put(updateAddress).delete(deleteAddress);
router.put("/:id/default", setDefault);

export default router;