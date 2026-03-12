import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 5000,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    mrp: {
      type: Number,
      required: [true, "MRP is required"],
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    brand: {
      type: String,
      trim: true,
      default: "",
    },
    // ✅ Updated for S3
    images: [
      {
        key: { type: String, required: true },   // S3 key for deletion
        url: { type: String, required: true },   // Full S3 URL
      },
    ],
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: 0,
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    tags: [String],
    specifications: [
      {
        key: String,
        value: String,
      },
    ],
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    totalSold: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ price: 1, category: 1 });
productSchema.index({ createdAt: -1 });

// Auto-generate slug & discount
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();
  }
  if (this.isModified("price") || this.isModified("mrp")) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  next();
});

productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

const Product = mongoose.model("Product", productSchema);
export default Product;