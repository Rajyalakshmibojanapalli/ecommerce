// routes/contactRoutes.js
import { Router } from "express";
import { protect, authorize  } from "../middlewares/authMiddleware.js";
import {
  submitContact,
  getAllContacts,
  getContact,
  updateContact,
  deleteContact,
} from "../controllers/contactController.js";

const router = Router();

router.post("/", submitContact);

// admin
router.get("/", protect, authorize("admin"), getAllContacts);
router
  .route("/:id")
  .get(protect, authorize("admin"), getContact)
  .put(protect, authorize("admin"), updateContact)
  .delete(protect, authorize("admin"), deleteContact);

export default router;