// routes/pageRoutes.js
import { Router } from "express";
import { protect, admin } from "../middleware/auth.js";
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
router.route("/").get(protect, admin, getAllPages).post(protect, admin, createPage);
router
  .route("/admin/:id")
  .put(protect, admin, updatePage)
  .delete(protect, admin, deletePage);

export default router;