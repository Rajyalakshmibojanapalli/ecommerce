// models/Banner.js
import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: String,
    image: {
      type: String,
      required: true,
    },
    mobileImage: String,
    link: {
      type: String,
      default: "/products",
    },
    buttonText: {
      type: String,
      default: "Shop Now",
    },
    position: {
      type: String,
      enum: ["hero", "category", "promo", "sidebar"],
      default: "hero",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: Date,
    endDate: Date,
    textColor: {
      type: String,
      default: "#ffffff",
    },
    overlayOpacity: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);