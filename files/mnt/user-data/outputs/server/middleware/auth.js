const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../utils/ErrorResponse");

/**
 * Protect routes — verifies JWT from Authorization header or cookie.
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check Authorization header first, then cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorResponse("Not authorized. Please log in.", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new ErrorResponse("User no longer exists.", 401));
    }

    if (!user.isActive) {
      return next(
        new ErrorResponse("Your account has been deactivated. Contact support.", 403)
      );
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return next(new ErrorResponse("Invalid token.", 401));
    }
    if (err.name === "TokenExpiredError") {
      return next(new ErrorResponse("Token expired. Please log in again.", 401));
    }
    return next(new ErrorResponse("Not authorized.", 401));
  }
};

/**
 * Authorize specific roles.
 * Usage: authorize("admin") or authorize("admin", "moderator")
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Role '${req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }
    next();
  };
};

/**
 * Optional auth — attaches user if token is present, but doesn't block.
 * Useful for routes that have different behavior for authenticated users.
 */
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
  } catch {
    req.user = null;
  }

  next();
};
