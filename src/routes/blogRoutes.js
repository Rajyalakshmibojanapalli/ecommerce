// routes/blogRoutes.js
import { Router } from "express";
import { protect, admin, optionalAuth } from "../middleware/auth.js";
import {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
} from "../controllers/blogController.js";

const router = Router();

router.get("/", optionalAuth, getBlogs);
router.get("/:slug", optionalAuth, getBlog);

router.post("/:id/like", protect, likeBlog);

// admin
router.post("/", protect, admin, createBlog);
router.route("/:id").put(protect, admin, updateBlog).delete(protect, admin, deleteBlog);

export default router;