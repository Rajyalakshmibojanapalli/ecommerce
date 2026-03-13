// src/controllers/authController.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import envConfig from "../config/envConfig.js";
import generateOTP from "../utils/generateOTP.js";
import { sendOTPEmail } from "../services/emailService.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, envConfig.jwtSecret, {
    expiresIn: envConfig.jwtExpire,
  });
};

// Set token in cookie
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + envConfig.jwtCookieExpire * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: envConfig.nodeEnv === "production",
    sameSite: "strict",
  };

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  res.cookie("token", token, cookieOptions);
  res.success({ user: userData, token }, message);
};

// ─── EXISTING ───

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.badRequest("Email already registered");
  }

  const user = await User.create({ name, email, password });
  sendTokenResponse(user, 201, res, "Registration successful");
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.unauthorized("Invalid email or password");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.unauthorized("Invalid email or password");
  }

  sendTokenResponse(user, 200, res, "Login successful");
});

export const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.success(null, "Logged out successfully");
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.success({ user }, "User profile fetched");
});

// ─── ✅ FORGOT PASSWORD — Send OTP ───

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.notFound("No account found with this email");
  }

  // Rate limit: 1 OTP per 60 seconds
  if (user.otp?.lastSentAt) {
    const timeDiff = Date.now() - new Date(user.otp.lastSentAt).getTime();
    const cooldown = 60 * 1000; // 60 seconds
    if (timeDiff < cooldown) {
      const remaining = Math.ceil((cooldown - timeDiff) / 1000);
      return res.badRequest(`Please wait ${remaining} seconds before requesting a new OTP`);
    }
  }

  // Generate 6-digit OTP
  const otp = generateOTP(6);

  // Save OTP to user (expires in 10 minutes)
  user.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    lastSentAt: new Date(),
  };
  await user.save({ validateBeforeSave: false });

  // Send OTP via email
  try {
    await sendOTPEmail(email, otp, "reset");
    res.success(
      { email, otpExpiresIn: "10 minutes" },
      "OTP sent to your email"
    );
  } catch (error) {
    // Clear OTP if email fails
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });
    console.error("Email error:", error.message);
    return res.error("Failed to send OTP email. Try again later.");
  }
});

// ─── ✅ VERIFY OTP ───

export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.notFound("User not found");
  }

  if (!user.otp?.code) {
    return res.badRequest("No OTP requested. Please request a new one.");
  }

  // Check max attempts (5 tries)
  if (user.otp.attempts >= 5) {
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });
    return res.badRequest("Too many attempts. Please request a new OTP.");
  }

  // Check expiry
  if (new Date() > new Date(user.otp.expiresAt)) {
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });
    return res.badRequest("OTP expired. Please request a new one.");
  }

  // Check OTP match
  if (user.otp.code !== otp) {
    user.otp.attempts += 1;
    await user.save({ validateBeforeSave: false });
    return res.badRequest(
      `Invalid OTP. ${5 - user.otp.attempts} attempts remaining.`
    );
  }

  res.success({ email, verified: true }, "OTP verified successfully");
});

// ─── ✅ RESET PASSWORD ───

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.notFound("User not found");
  }

  if (!user.otp?.code) {
    return res.badRequest("No OTP requested. Please request a new one.");
  }

  // Check expiry
  if (new Date() > new Date(user.otp.expiresAt)) {
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });
    return res.badRequest("OTP expired. Please request a new one.");
  }

  // Check OTP match
  if (user.otp.code !== otp) {
    return res.badRequest("Invalid OTP");
  }

  // Reset password
  user.password = newPassword;
  user.otp = undefined; // Clear OTP
  await user.save();

  res.success(null, "Password reset successful. Please login.");
});

// ─── ✅ RESEND OTP ───

export const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.notFound("No account found with this email");
  }

  // Rate limit: 1 OTP per 60 seconds
  if (user.otp?.lastSentAt) {
    const timeDiff = Date.now() - new Date(user.otp.lastSentAt).getTime();
    const cooldown = 60 * 1000;
    if (timeDiff < cooldown) {
      const remaining = Math.ceil((cooldown - timeDiff) / 1000);
      return res.badRequest(`Please wait ${remaining} seconds`);
    }
  }

  const otp = generateOTP(6);

  user.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    lastSentAt: new Date(),
  };
  await user.save({ validateBeforeSave: false });

  try {
    await sendOTPEmail(email, otp, "reset");
    res.success({ email }, "OTP resent successfully");
  } catch (error) {
    console.error("Email error:", error.message);
    return res.error("Failed to send OTP");
  }
});