// routes/index.js
import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import productRoutes from "./productRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import cartRoutes from "./cartRoutes.js";
import orderRoutes from "./orderRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import couponRoutes from "./couponRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
// ─── NEW ───
import wishlistRoutes from "./wishlistRoutes.js";
import newsletterRoutes from "./newsletterRoutes.js";
import contactRoutes from "./contactRoutes.js";
import blogRoutes from "./blogRoutes.js";
import pageRoutes from "./pageRoutes.js";
import bannerRoutes from "./bannerRoutes.js";
import customDesignRoutes from "./customDesignRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import addressRoutes from "./addressRoutes.js";
import searchRoutes from "./searchRoutes.js";

const router = Router();

// ─── EXISTING ───
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/coupons", couponRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);

// ─── NEW ───
router.use("/wishlist", wishlistRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/contact", contactRoutes);
router.use("/blogs", blogRoutes);
router.use("/pages", pageRoutes);
router.use("/banners", bannerRoutes);
router.use("/custom-designs", customDesignRoutes);
router.use("/notifications", notificationRoutes);
router.use("/addresses", addressRoutes);
router.use("/search", searchRoutes);

export default router;