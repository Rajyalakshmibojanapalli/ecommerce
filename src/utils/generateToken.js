import jwt from "jsonwebtoken";
import envConfig from "../config/envConfig.js";

export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, envConfig.jwtSecret, {
    expiresIn: envConfig.jwtExpire,
  });
};

export const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateAccessToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + envConfig.jwtCookieExpire * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: envConfig.nodeEnv === "production",
    sameSite: "strict",
  };

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      data: { user },
    });
};