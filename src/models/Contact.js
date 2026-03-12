// models/Contact.js
import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      enum: [
        "general",
        "order-issue",
        "return-exchange",
        "custom-design",
        "partnership",
        "feedback",
        "other",
      ],
      default: "general",
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      maxlength: 2000,
    },
    orderId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved", "closed"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);