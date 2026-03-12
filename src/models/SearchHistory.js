// models/SearchHistory.js
import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    query: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
    filters: {
      category: String,
      minPrice: Number,
      maxPrice: Number,
      sort: String,
    },
    sessionId: String,
  },
  { timestamps: true }
);

searchHistorySchema.index({ query: 1 });
searchHistorySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("SearchHistory", searchHistorySchema);