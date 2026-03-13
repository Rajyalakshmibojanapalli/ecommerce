// routes/customDesignRoutes.js
import { Router } from "express";
import { protect, authorize  } from "../middlewares/authMiddleware.js";
import {
  createDesign,
  getMyDesigns,
  getDesign,
  updateDesign,
  submitDesign,
  deleteDesign,
  getAllDesigns,
  updateDesignStatus,
  getDesignPrices,
} from "../controllers/customDesignController.js";

const router = Router();

router.get("/prices", getDesignPrices);

router.use(protect);

router.route("/").get(getMyDesigns).post(createDesign);
router.route("/:id").get(getDesign).put(updateDesign).delete(deleteDesign);
router.post("/:id/submit", submitDesign);

// admin
router.get("/admin/all", authorize("admin"), getAllDesigns);
router.put("/admin/:id/status", authorize("admin"), updateDesignStatus);

export default router;