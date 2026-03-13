/**
 * Universal Response Helper
 * Handles ALL API responses in one place
 * 
 * Usage:
 *   res.success(data, "Message", 200)
 *   res.created(data, "Created")
 *   res.error("Something went wrong", 500)
 *   res.notFound("User not found")
 *   res.unauthorized("Please login")
 *   res.forbidden("Access denied")
 *   res.badRequest("Invalid input", errors)
 *   res.paginated(data, pagination)
 *   res.noContent()
 */

// ==========================================
//  ATTACH TO res OBJECT (Middleware)
// ==========================================
const responseHandler = (req, res, next) => {

  // ✅ SUCCESS (200)
  res.success = (data = null, message = "Success") => {
    return res.status(200).json({
      success: 1,
      statusCode: 200,
      message,
      data,
    });
  };

  // ✅ CREATED (201)
  res.created = (data = null, message = "Created successfully") => {
    return res.status(201).json({
      success: 1,
      statusCode: 201,
      message,
      data,
    });
  };

  // ✅ NO CONTENT (204 - but send 200 with message for JSON APIs)
  res.noContent = (message = "Deleted successfully") => {
    return res.status(200).json({
      success: 1,
      statusCode: 200,
      message,
      data: null,
    });
  };

  // ✅ PAGINATED RESPONSE
  // res.paginated = (data, pagination, message = "Success") => {
  //   return res.status(200).json({
  //     success: 1,
  //     statusCode: 200,
  //     message,
  //     data,
  //     pagination: {
  //       currentPage: pagination.page,
  //       totalPages: Math.ceil(pagination.total / pagination.limit),
  //       totalItems: pagination.total,
  //       perPage: pagination.limit,
  //       hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
  //       hasPrevPage: pagination.page > 1,
  //     },
  //   });
  // };

  // In utils/response.js — paginated method
res.paginated = (data, pagination, message = "Success") => {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
};

  // ✅ TOKEN RESPONSE (Login/Register)
  res.withToken = (data, token, message = "Success") => {
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    return res
      .status(200)
      .cookie("token", token, cookieOptions)
      .json({
        success: 1,
        statusCode: 200,
        message,
        data,
        token,
      });
  };

  // ❌ BAD REQUEST (400)
  res.badRequest = (message = "Bad request", errors = []) => {
    return res.status(400).json({
      success: 0,
      statusCode: 400,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
      data: null,
    });
  };

  // ❌ UNAUTHORIZED (401)
  res.unauthorized = (message = "Unauthorized, please login") => {
    return res.status(401).json({
      success: 0,
      statusCode: 401,
      message,
      data: null,
    });
  };

  // ❌ FORBIDDEN (403)
  res.forbidden = (message = "Access denied") => {
    return res.status(403).json({
      success: 0,
      statusCode: 403,
      message,
      data: null,
    });
  };

  // ❌ NOT FOUND (404)
  res.notFound = (message = "Resource not found") => {
    return res.status(404).json({
      success: 0,
      statusCode: 404,
      message,
      data: null,
    });
  };

  // ❌ CONFLICT (409)
  res.conflict = (message = "Resource already exists") => {
    return res.status(409).json({
      success: 0,
      statusCode: 409,
      message,
      data: null,
    });
  };

  // ❌ VALIDATION ERROR (422)
  res.validationError = (errors = [], message = "Validation failed") => {
    return res.status(422).json({
      success: 0,
      statusCode: 422,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
      data: null,
    });
  };

  // ❌ TOO MANY REQUESTS (429)
  res.tooMany = (message = "Too many requests, try again later") => {
    return res.status(429).json({
      success: 0,
      statusCode: 429,
      message,
      data: null,
    });
  };

  // ❌ INTERNAL SERVER ERROR (500)
  res.error = (message = "Internal server error", statusCode = 500) => {
    return res.status(statusCode).json({
      success: 0,
      statusCode,
      message,
      data: null,
    });
  };

  // 🔧 CUSTOM - Any status, any shape
  res.custom = (statusCode, success, message, data = null, extras = {}) => {
    return res.status(statusCode).json({
      success,
      statusCode,
      message,
      data,
      ...extras,
    });
  };

  next();
};

export default responseHandler;