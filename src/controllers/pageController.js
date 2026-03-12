// controllers/pageController.js
import Page from "../models/Page.js";

// GET /api/pages/:slug
export const getPage = async (req, res, next) => {
  try {
    const page = await Page.findOne({
      slug: req.params.slug,
      isPublished: true,
    });

    if (!page) {
      return res.status(404).json({ success: false, message: "Page not found" });
    }

    res.json({ success: true, data: { page } });
  } catch (err) {
    next(err);
  }
};

// GET /api/pages (admin)
export const getAllPages = async (req, res, next) => {
  try {
    const pages = await Page.find()
      .sort("title")
      .populate("lastUpdatedBy", "name");

    res.json({ success: true, data: { pages } });
  } catch (err) {
    next(err);
  }
};

// POST /api/pages (admin)
export const createPage = async (req, res, next) => {
  try {
    const page = await Page.create({
      ...req.body,
      lastUpdatedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: { page } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/pages/:id (admin)
export const updatePage = async (req, res, next) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!page) {
      return res.status(404).json({ success: false, message: "Page not found" });
    }

    res.json({ success: true, data: { page } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/pages/:id (admin)
export const deletePage = async (req, res, next) => {
  try {
    await Page.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Page deleted" });
  } catch (err) {
    next(err);
  }
};