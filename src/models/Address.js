// models/Address.js
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    label: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: "India",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    landmark: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

addressSchema.index({ user: 1 });

// ensure only one default address per user
addressSchema.pre("save", async function (next) {
  if (this.isModified("isDefault") && this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export default mongoose.model("Address", addressSchema);