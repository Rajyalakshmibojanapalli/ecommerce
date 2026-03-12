// controllers/blogController.js
import Blog from "../models/Blog.js";

// GET /api/blogs
export const getBlogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      tag,
      featured,
      status,
      search,
      sort = "-publishedAt",
    } = req.query;

    const query = {};

    // public sees only published
    if (!req.user || req.user.role !== "admin") {
      query.status = "published";
    } else if (status) {
      query.status = status;
    }

    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag.toLowerCase()] };
    if (featured === "true") query.isFeatured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $in: [search.toLowerCase()] } },
      ];
    }

    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .populate("author", "name")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-content -likedBy"); // list view — exclude heavy fields

    res.json({
      success: true,
      data: {
        blogs,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/blogs/:slug
export const getBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate(
      "author",
      "name"
    );

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    if (blog.status !== "published" && (!req.user || req.user.role !== "admin")) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    // increment views
    blog.views += 1;
    await blog.save();

    res.json({ success: true, data: { blog } });
  } catch (err) {
    next(err);
  }
};

// POST /api/blogs (admin)
export const createBlog = async (req, res, next) => {
  try {
    const blog = await Blog.create({
      ...req.body,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Blog created",
      data: { blog },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/blogs/:id (admin)
export const updateBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    res.json({ success: true, message: "Blog updated", data: { blog } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/blogs/:id (admin)
export const deleteBlog = async (req, res, next) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Blog deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/blogs/:id/like
export const likeBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const userId = req.user._id;
    const alreadyLiked = blog.likedBy.includes(userId);

    if (alreadyLiked) {
      blog.likedBy = blog.likedBy.filter((id) => id.toString() !== userId.toString());
      blog.likes = Math.max(0, blog.likes - 1);
    } else {
      blog.likedBy.push(userId);
      blog.likes += 1;
    }

    await blog.save();

    res.json({
      success: true,
      data: { likes: blog.likes, isLiked: !alreadyLiked },
    });
  } catch (err) {
    next(err);
  }
};