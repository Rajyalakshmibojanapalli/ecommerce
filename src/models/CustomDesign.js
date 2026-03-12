// models/CustomDesign.js
import mongoose from "mongoose";

const customDesignSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    productType: {
      type: String,
      enum: ["tshirt", "hoodie", "polo", "tank-top", "sweatshirt"],
      default: "tshirt",
    },
    size: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
      required: true,
    },
    color: {
      name: { type: String, required: true },
      hex: { type: String, required: true },
    },
    design: {
      frontImage: String,
      backImage: String,
      frontText: {
        content: String,
        font: String,
        color: String,
        size: Number,
        position: { x: Number, y: Number },
      },
      backText: {
        content: String,
        font: String,
        color: String,
        size: Number,
        position: { x: Number, y: Number },
      },
    },
    template: {
      type: String,
      enum: ["blank", "minimal-wave", "urban-graffiti", "retro-sunset", "abstract-geo", "nature-bloom", "neon-dreams"],
      default: "blank",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "in-review", "approved", "in-production", "completed", "cancelled"],
      default: "draft",
    },
    previewImage: String,
    notes: String,
    adminNotes: String,
    estimatedDelivery: Date,
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  { timestamps: true }
);

customDesignSchema.index({ user: 1, status: 1 });

export default mongoose.model("CustomDesign", customDesignSchema);