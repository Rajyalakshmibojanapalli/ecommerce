// controllers/bannerController.js
import Banner from "../models/Banner.js";

// GET /api/banners
export const getBanners = async (req, res, next) => {
  try {
    const { position } = req.query;

    const query = { isActive: true };
    if (position) query.position = position;

    const now = new Date();
    query.$or = [
      { startDate: { $exists: false }, endDate: { $exists: false } },
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
    ];

    const banners = await Banner.find(query).sort("order");

    res.json({ success: true, data: { banners } });
  } catch (err) {
    next(err);
  }
};

// GET /api/banners/all (admin — includes inactive)
export const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort("position order");
    res.json({ success: true, data: { banners } });
  } catch (err) {
    next(err);
  }
};

// POST /api/banners (admin)
export const createBanner = async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, data: { banner } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/banners/:id (admin)
export const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.json({ success: true, data: { banner } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/banners/:id (admin)
export const deleteBanner = async (req, res, next) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Banner deleted" });
  } catch (err) {
    next(err);
  }
};