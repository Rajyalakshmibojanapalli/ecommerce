// routes/pageRoutes.js
import { Router } from "express";
import { protect, authorize  } from "../middlewares/authMiddleware.js";
import {
  getPage,
  getAllPages,
  createPage,
  updatePage,
  deletePage,
} from "../controllers/pageController.js";

const router = Router();

router.get("/:slug", getPage);

// admin
router.route("/").get(protect, authorize("admin"), getAllPages).post(protect, authorize("admin"), createPage);
router
  .route("/admin/:id")
  .put(protect, authorize("admin"), updatePage)
  .delete(protect, authorize("admin"), deletePage);

export default router;