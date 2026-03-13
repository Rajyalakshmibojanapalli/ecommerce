// routes/blogRoutes.js
import { Router } from "express";
import { protect, authorize  } from "../middlewares/authMiddleware.js";
import {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
} from "../controllers/blogController.js";

const router = Router();

router.get("/",  getBlogs);
router.get("/:slug",  getBlog);

router.post("/:id/like", protect, likeBlog);

// admin
router.post("/", protect, authorize("admin"), createBlog);
router.route("/:id").put(protect, authorize("admin"), updateBlog).delete(protect, authorize("admin"), deleteBlog);

export default router;