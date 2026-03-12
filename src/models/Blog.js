// models/Blog.js
import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      maxlength: 500,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    coverImage: {
      type: String,
      default: "",
    },
    images: [String],
    category: {
      type: String,
      enum: [
        "fashion-tips",
        "style-guide",
        "behind-the-scenes",
        "sustainability",
        "trends",
        "announcements",
        "how-to",
      ],
      default: "fashion-tips",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: Date,
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    readTime: {
      type: Number, // in minutes
      default: 5,
    },
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

// auto-generate slug
blogSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // calculate read time (~200 words per minute)
  if (this.isModified("content")) {
    const words = this.content.split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(words / 200));
  }

  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ category: 1 });

export default mongoose.model("Blog", blogSchema);