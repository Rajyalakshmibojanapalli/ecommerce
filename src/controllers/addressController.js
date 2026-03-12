// controllers/addressController.js
import Address from "../models/Address.js";

// GET /api/addresses
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort(
      "-isDefault createdAt"
    );

    res.json({ success: true, data: { addresses } });
  } catch (err) {
    next(err);
  }
};

// POST /api/addresses
export const addAddress = async (req, res, next) => {
  try {
    const count = await Address.countDocuments({ user: req.user._id });
    if (count >= 10) {
      return res
        .status(400)
        .json({ success: false, message: "Maximum 10 addresses allowed" });
    }

    // if first address, make default
    const isFirst = count === 0;

    const address = await Address.create({
      ...req.body,
      user: req.user._id,
      isDefault: req.body.isDefault || isFirst,
    });

    res
      .status(201)
      .json({ success: true, message: "Address added", data: { address } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    Object.assign(address, req.body);
    await address.save();

    res.json({ success: true, message: "Address updated", data: { address } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // if deleted was default, make another default
    if (address.isDefault) {
      const next = await Address.findOne({ user: req.user._id }).sort("createdAt");
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    res.json({ success: true, message: "Address deleted" });
  } catch (err) {
    next(err);
  }
};

// PUT /api/addresses/:id/default
export const setDefault = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    address.isDefault = true;
    await address.save(); // pre-save hook removes other defaults

    res.json({ success: true, message: "Default address updated", data: { address } });
  } catch (err) {
    next(err);
  }
};