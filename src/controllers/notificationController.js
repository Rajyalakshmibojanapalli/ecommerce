// controllers/notificationController.js
import Notification from "../models/Notification.js";

// GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;

    const query = { user: req.user._id };
    if (unread === "true") query.isRead = false;

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    const notifications = await Notification.find(query)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.json({ success: true, data: { notification } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notifications/read-all
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notifications
export const clearAll = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    next(err);
  }
};

// utility: create notification (used internally)
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  link,
  image,
  metadata,
}) => {
  try {
    return await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      image,
      metadata,
    });
  } catch (err) {
    console.error("Notification creation error:", err.message);
  }
};

// POST /api/notifications/admin/broadcast (admin)
export const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, link, type = "promo" } = req.body;

    const User = (await import("../models/User.js")).default;
    const users = await User.find({ isActive: { $ne: false } }).select("_id");

    const notifications = users.map((u) => ({
      user: u._id,
      type,
      title,
      message,
      link,
    }));

    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: `Broadcast sent to ${users.length} users`,
    });
  } catch (err) {
    next(err);
  }
};