const ErrorResponse = require("../utils/ErrorResponse");

/**
 * Global Express Error Handler.
 * Must be the last middleware registered.
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // ─── Mongoose Bad ObjectId ────────────────────────────────────────────────────
  if (err.name === "CastError") {
    error = new ErrorResponse(`Resource not found with id: ${err.value}`, 404);
  }

  // ─── Mongoose Duplicate Key ───────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = new ErrorResponse(
      `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already taken.`,
      400
    );
  }

  // ─── Mongoose Validation Error ────────────────────────────────────────────────
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ErrorResponse(messages.join(". "), 400);
  }

  // ─── Multer File Size Error ───────────────────────────────────────────────────
  if (err.code === "LIMIT_FILE_SIZE") {
    error = new ErrorResponse(
      `File too large. Maximum size is ${process.env.MAX_FILE_UPLOAD / 1000000}MB.`,
      413
    );
  }

  // ─── JWT Errors ───────────────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    error = new ErrorResponse("Invalid token.", 401);
  }
  if (err.name === "TokenExpiredError") {
    error = new ErrorResponse("Token expired. Please log in again.", 401);
  }

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${error.statusCode} - ${error.message}`);
    console.error(err.stack);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
