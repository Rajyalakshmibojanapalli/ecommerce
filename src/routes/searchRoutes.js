// routes/searchRoutes.js
import { Router } from "express";
import { protect, optionalAuth } from "../middleware/auth.js";
import {
  globalSearch,
  getSuggestions,
  getTrending,
  getSearchHistory,
  clearSearchHistory,
} from "../controllers/searchController.js";

const router = Router();

router.get("/", optionalAuth, globalSearch);
router.get("/suggestions", getSuggestions);
router.get("/trending", getTrending);

// authenticated
router.get("/history", protect, getSearchHistory);
router.delete("/history", protect, clearSearchHistory);

export default router;