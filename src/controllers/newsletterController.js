// controllers/newsletterController.js
import crypto from "crypto";
import Newsletter from "../models/Newsletter.js";

// POST /api/newsletter/subscribe
export const subscribe = async (req, res, next) => {
  try {
    const { email, name, source } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const existing = await Newsletter.findOne({ email: email.toLowerCase() });

    if (existing) {
      if (existing.isActive) {
        return res
          .status(400)
          .json({ success: false, message: "Already subscribed" });
      }
      // re-subscribe
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      await existing.save();

      return res.json({
        success: true,
        message: "Welcome back! Re-subscribed successfully",
      });
    }

    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    await Newsletter.create({
      email: email.toLowerCase(),
      name,
      source: source || "footer",
      unsubscribeToken,
    });

    res.status(201).json({
      success: true,
      message: "Subscribed successfully! Welcome to the Jaimax Club",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Already subscribed" });
    }
    next(err);
  }
};

// POST /api/newsletter/unsubscribe
export const unsubscribe = async (req, res, next) => {
  try {
    const { email, token } = req.body;

    const query = token ? { unsubscribeToken: token } : { email: email?.toLowerCase() };
    const subscriber = await Newsletter.findOne(query);

    if (!subscriber) {
      return res.status(404).json({ success: false, message: "Subscriber not found" });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.json({ success: true, message: "Unsubscribed successfully" });
  } catch (err) {
    next(err);
  }
};

// GET /api/newsletter (admin)
export const getAllSubscribers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, active } = req.query;

    const query = {};
    if (active !== undefined) query.isActive = active === "true";

    const total = await Newsletter.countDocuments(query);
    const subscribers = await Newsletter.find(query)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const activeCount = await Newsletter.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        subscribers,
        total,
        activeCount,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/newsletter/:id (admin)
export const deleteSubscriber = async (req, res, next) => {
  try {
    await Newsletter.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Subscriber deleted" });
  } catch (err) {
    next(err);
  }
};