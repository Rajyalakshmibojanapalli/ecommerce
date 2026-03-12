// models/Page.js
import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    sections: [
      {
        heading: String,
        body: String,
        icon: String,
        order: { type: Number, default: 0 },
      },
    ],
    metaTitle: String,
    metaDescription: String,
    isPublished: {
      type: Boolean,
      default: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Page", pageSchema);