/**
 * Custom Error class for operational errors.
 * Operational errors are predictable runtime errors we can safely handle.
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;
