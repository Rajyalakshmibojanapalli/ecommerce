// controllers/searchController.js
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Blog from "../models/Blog.js";
import SearchHistory from "../models/SearchHistory.js";

// GET /api/search
export const globalSearch = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res
        .status(400)
        .json({ success: false, message: "Search query must be at least 2 characters" });
    }

    const regex = new RegExp(q.trim(), "i");

    // parallel search across models
    const [products, categories, blogs] = await Promise.all([
      Product.find({
        $or: [
          { name: regex },
          { description: regex },
          { tags: { $in: [regex] } },
        ],
        isActive: { $ne: false },
      })
        .select("name price images slug averageRating stock")
        .sort("-averageRating")
        .limit(Number(limit))
        .skip((page - 1) * limit),

      Category.find({ name: regex }).select("name slug image").limit(5),

      Blog.find({
        $or: [{ title: regex }, { excerpt: regex }, { tags: { $in: [q.toLowerCase()] } }],
        status: "published",
      })
        .select("title slug coverImage excerpt publishedAt")
        .limit(5),
    ]);

    const totalProducts = await Product.countDocuments({
      $or: [{ name: regex }, { description: regex }],
      isActive: { $ne: false },
    });

    // save search history
    try {
      await SearchHistory.create({
        user: req.user?._id,
        query: q.trim().toLowerCase(),
        resultsCount: totalProducts,
      });
    } catch {
      // silent
    }

    res.json({
      success: true,
      data: {
        products,
        categories,
        blogs,
        totalProducts,
        page: Number(page),
        pages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/search/suggestions
export const getSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({ success: true, data: { suggestions: [] } });
    }

    const regex = new RegExp(`^${q.trim()}`, "i");

    const [products, categories] = await Promise.all([
      Product.find({ name: regex, isActive: { $ne: false } })
        .select("name slug images")
        .limit(5),
      Category.find({ name: regex }).select("name slug").limit(3),
    ]);

    const suggestions = [
      ...categories.map((c) => ({
        type: "category",
        text: c.name,
        slug: c.slug,
      })),
      ...products.map((p) => ({
        type: "product",
        text: p.name,
        slug: p.slug,
        image: p.images?.[0],
      })),
    ];

    res.json({ success: true, data: { suggestions } });
  } catch (err) {
    next(err);
  }
};

// GET /api/search/trending
export const getTrending = async (_req, res, next) => {
  try {
    const trending = await SearchHistory.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: "$query", count: { $sum: 1 }, avgResults: { $avg: "$resultsCount" } } },
      { $match: { avgResults: { $gt: 0 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { query: "$_id", count: 1, _id: 0 } },
    ]);

    res.json({ success: true, data: { trending } });
  } catch (err) {
    next(err);
  }
};

// GET /api/search/history (user's history)
export const getSearchHistory = async (req, res, next) => {
  try {
    const history = await SearchHistory.find({ user: req.user._id })
      .sort("-createdAt")
      .limit(20)
      .select("query createdAt");

    // deduplicate
    const seen = new Set();
    const unique = history.filter((h) => {
      if (seen.has(h.query)) return false;
      seen.add(h.query);
      return true;
    });

    res.json({ success: true, data: { history: unique.slice(0, 10) } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/search/history
export const clearSearchHistory = async (req, res, next) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.json({ success: true, message: "Search history cleared" });
  } catch (err) {
    next(err);
  }
};