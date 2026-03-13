// routes/searchRoutes.js
import { Router } from "express";
import { protect,  } from "../middlewares/authMiddleware.js";
import {
  globalSearch,
  getSuggestions,
  getTrending,
  getSearchHistory,
  clearSearchHistory,
} from "../controllers/searchController.js";

const router = Router();

router.get("/",  globalSearch);
router.get("/suggestions", getSuggestions);
router.get("/trending", getTrending);

// authenticated
router.get("/history", protect, getSearchHistory);
router.delete("/history", protect, clearSearchHistory);

export default router;