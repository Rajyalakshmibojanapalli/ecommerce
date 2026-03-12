// controllers/customDesignController.js
import CustomDesign from "../models/CustomDesign.js";

// base price lookup
const BASE_PRICES = {
  tshirt: 499,
  hoodie: 999,
  polo: 699,
  "tank-top": 399,
  sweatshirt: 899,
};

// POST /api/custom-designs
export const createDesign = async (req, res, next) => {
  try {
    const basePrice = BASE_PRICES[req.body.productType] || 499;
    const hasCustomImage = req.body.design?.frontImage || req.body.design?.backImage;
    const customFee = hasCustomImage ? 150 : 0;

    const design = await CustomDesign.create({
      ...req.body,
      user: req.user._id,
      price: basePrice + customFee,
    });

    res.status(201).json({
      success: true,
      message: "Design saved",
      data: { design },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/custom-designs
export const getMyDesigns = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const total = await CustomDesign.countDocuments(query);
    const designs = await CustomDesign.find(query)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        designs,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/custom-designs/:id
export const getDesign = async (req, res, next) => {
  try {
    const design = await CustomDesign.findById(req.params.id);

    if (!design) {
      return res.status(404).json({ success: false, message: "Design not found" });
    }

    // users can only see their own, admins can see all
    if (
      design.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, data: { design } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/custom-designs/:id
export const updateDesign = async (req, res, next) => {
  try {
    const design = await CustomDesign.findById(req.params.id);

    if (!design) {
      return res.status(404).json({ success: false, message: "Design not found" });
    }

    if (design.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // users can only update drafts
    if (req.user.role !== "admin" && design.status !== "draft") {
      return res
        .status(400)
        .json({ success: false, message: "Can only edit draft designs" });
    }

    Object.assign(design, req.body);

    if (req.body.productType) {
      const basePrice = BASE_PRICES[req.body.productType] || 499;
      const hasImage = design.design?.frontImage || design.design?.backImage;
      design.price = basePrice + (hasImage ? 150 : 0);
    }

    await design.save();

    res.json({ success: true, data: { design } });
  } catch (err) {
    next(err);
  }
};

// POST /api/custom-designs/:id/submit
export const submitDesign = async (req, res, next) => {
  try {
    const design = await CustomDesign.findById(req.params.id);

    if (!design) {
      return res.status(404).json({ success: false, message: "Design not found" });
    }

    if (design.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (design.status !== "draft") {
      return res
        .status(400)
        .json({ success: false, message: "Design already submitted" });
    }

    design.status = "submitted";
    await design.save();

    res.json({
      success: true,
      message: "Design submitted for review",
      data: { design },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/custom-designs/:id
export const deleteDesign = async (req, res, next) => {
  try {
    const design = await CustomDesign.findById(req.params.id);

    if (!design) {
      return res.status(404).json({ success: false, message: "Design not found" });
    }

    if (design.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await design.deleteOne();
    res.json({ success: true, message: "Design deleted" });
  } catch (err) {
    next(err);
  }
};

// GET /api/custom-designs/admin/all (admin)
export const getAllDesigns = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const total = await CustomDesign.countDocuments(query);
    const designs = await CustomDesign.find(query)
      .populate("user", "name email")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const stats = {
      submitted: await CustomDesign.countDocuments({ status: "submitted" }),
      inReview: await CustomDesign.countDocuments({ status: "in-review" }),
      inProduction: await CustomDesign.countDocuments({ status: "in-production" }),
    };

    res.json({
      success: true,
      data: { designs, total, stats, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/custom-designs/admin/:id/status (admin)
export const updateDesignStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, estimatedDelivery } = req.body;

    const design = await CustomDesign.findById(req.params.id);
    if (!design) {
      return res.status(404).json({ success: false, message: "Design not found" });
    }

    if (status) design.status = status;
    if (adminNotes) design.adminNotes = adminNotes;
    if (estimatedDelivery) design.estimatedDelivery = estimatedDelivery;

    await design.save();

    res.json({ success: true, data: { design } });
  } catch (err) {
    next(err);
  }
};

// GET /api/custom-designs/prices
export const getDesignPrices = async (_req, res) => {
  res.json({
    success: true,
    data: {
      basePrices: BASE_PRICES,
      customImageFee: 150,
    },
  });
};