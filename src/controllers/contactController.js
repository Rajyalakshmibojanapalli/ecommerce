// controllers/contactController.js
import Contact from "../models/Contact.js";

// POST /api/contact
export const submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, orderId } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email, and message are required" });
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject: subject || "general",
      message,
      orderId,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully! We'll get back to you within 24 hours.",
      data: { contact },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/contact (admin)
export const getAllContacts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, subject, priority } = req.query;

    const query = {};
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (priority) query.priority = priority;

    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("resolvedBy", "name");

    const stats = {
      new: await Contact.countDocuments({ status: "new" }),
      inProgress: await Contact.countDocuments({ status: "in-progress" }),
      resolved: await Contact.countDocuments({ status: "resolved" }),
    };

    res.json({
      success: true,
      data: {
        contacts,
        total,
        stats,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/contact/:id (admin)
export const getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id).populate(
      "resolvedBy",
      "name email"
    );
    if (!contact) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true, data: { contact } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/contact/:id (admin)
export const updateContact = async (req, res, next) => {
  try {
    const { status, priority, adminNotes } = req.body;

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    if (status) contact.status = status;
    if (priority) contact.priority = priority;
    if (adminNotes !== undefined) contact.adminNotes = adminNotes;

    if (status === "resolved" && contact.status !== "resolved") {
      contact.resolvedAt = new Date();
      contact.resolvedBy = req.user._id;
    }

    await contact.save();

    res.json({
      success: true,
      message: "Contact updated",
      data: { contact },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/contact/:id (admin)
export const deleteContact = async (req, res, next) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Contact deleted" });
  } catch (err) {
    next(err);
  }
};