import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateAccessToken } from "../utils/generateToken.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import { presignUserAvatar } from "../services/s3Service.js";

// @desc    Register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.conflict("User already exists with this email");
  }

  const user = await User.create({ name, email, password, phone });
  user.password = undefined;

  const token = generateAccessToken(user._id);

  sendWelcomeEmail(user).catch(console.error);

  // ✅ Presign avatar
  const presigned = await presignUserAvatar(user);

  return res.withToken({ user: presigned }, token, "Registration successful");
});

// @desc    Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) return res.unauthorized("Invalid email or password");
  if (!user.isActive) return res.forbidden("Your account has been deactivated");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.unauthorized("Invalid email or password");

  user.password = undefined;
  const token = generateAccessToken(user._id);

  // ✅ Presign avatar
  const presigned = await presignUserAvatar(user);

  return res.withToken({ user: presigned }, token, "Login successful");
});

// @desc    Logout
export const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  return res.success(null, "Logged out successfully");
});

// @desc    Get current user
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("addresses");

  // ✅ Presign avatar
  const presigned = await presignUserAvatar(user);

  return res.success({ user: presigned });
});