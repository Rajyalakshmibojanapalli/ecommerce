import User from "../models/User.js";
import Address from "../models/Address.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  uploadAvatar,
  deleteFromS3,
  presignUserAvatar,
} from "../services/s3Service.js";

// @desc    Update profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true }
  );

  const presigned = await presignUserAvatar(user);
  return res.success({ user: presigned }, "Profile updated");
});

// @desc    Update avatar
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.badRequest("Please upload an image");

  const user = await User.findById(req.user._id);

  if (user.avatar?.key) {
    await deleteFromS3(user.avatar.key);
  }

  try {
    const avatar = await uploadAvatar(req.file);
    user.avatar = avatar;
    await user.save();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Upload failed: " + err.message,
    });
  }

  const presigned = await presignUserAvatar(user);
  return res.success({ user: presigned }, "Avatar updated");
});

// @desc    Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) return res.badRequest("Current password is incorrect");

  user.password = newPassword;
  await user.save();

  return res.success(null, "Password changed successfully");
});

// =================== ADDRESS ===================

export const addAddress = asyncHandler(async (req, res) => {
  const address = await Address.create({ ...req.body, user: req.user._id });

  if (address.isDefault) {
    await Address.updateMany(
      { user: req.user._id, _id: { $ne: address._id } },
      { isDefault: false }
    );
  }

  await User.findByIdAndUpdate(req.user._id, {
    $push: { addresses: address._id },
  });

  return res.created({ address }, "Address added");
});

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort("-isDefault");
  return res.success({ addresses });
});

export const updateAddress = asyncHandler(async (req, res) => {
  let address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) return res.notFound("Address not found");

  address = await Address.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (address.isDefault) {
    await Address.updateMany(
      { user: req.user._id, _id: { $ne: address._id } },
      { isDefault: false }
    );
  }

  return res.success({ address }, "Address updated");
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!address) return res.notFound("Address not found");

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { addresses: address._id },
  });

  return res.noContent("Address deleted");
});

