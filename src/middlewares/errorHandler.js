import ApiError from "../utils/ApiError.js";
import envConfig from "../config/envConfig.js";

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for dev
  if (envConfig.nodeEnv === "development") {
    console.error("❌ Error:", err);
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = new ApiError(400, "Resource not found");
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ApiError(400, `${field} already exists`);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, "Validation Error", messages);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token");
  }
  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Token expired");
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
    errors: error.errors || [],
    ...(envConfig.nodeEnv === "development" && { stack: err.stack }),
  });
};

export default errorHandler;