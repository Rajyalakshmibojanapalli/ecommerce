// models/Newsletter.js
import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      enum: ["footer", "popup", "checkout", "blog", "other"],
      default: "footer",
    },
    unsubscribeToken: {
      type: String,
    },
    unsubscribedAt: Date,
    preferences: {
      newArrivals: { type: Boolean, default: true },
      sales: { type: Boolean, default: true },
      blog: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Newsletter", newsletterSchema);