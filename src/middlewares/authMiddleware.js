import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import envConfig from "../config/envConfig.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.unauthorized("Not authorized, please login");
  }

  try {
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) return res.unauthorized("User not found");
    if (!req.user.isActive) return res.forbidden("Account deactivated");

    next();
  } catch (error) {
    return res.unauthorized("Not authorized, token failed");
  }
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.forbidden(`Role '${req.user.role}' is not allowed`);
    }
    next();
  };
};