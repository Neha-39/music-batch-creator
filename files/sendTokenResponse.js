/**
 * Create JWT, attach it to a cookie, and send the response.
 * @param {Object} user  - Mongoose User document
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Not accessible via document.cookie
    sameSite: "strict",
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true; // Only send over HTTPS in production
  }

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      data: user,
    });
};

module.exports = sendTokenResponse;
