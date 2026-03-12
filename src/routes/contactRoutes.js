// routes/contactRoutes.js
import { Router } from "express";
import { protect, admin } from "../middleware/auth.js";
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
router.get("/", protect, admin, getAllContacts);
router
  .route("/:id")
  .get(protect, admin, getContact)
  .put(protect, admin, updateContact)
  .delete(protect, admin, deleteContact);

export default router;