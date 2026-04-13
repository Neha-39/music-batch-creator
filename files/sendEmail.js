const nodemailer = require("nodemailer");

/**
 * Send an email using Nodemailer.
 * @param {Object} options - { email, subject, message, html }
 */
const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
};

/**
 * Build HTML email templates
 */
const emailTemplates = {
  resetPassword: (name, resetUrl) => ({
    subject: "Password Reset Request – Music Batch Creator",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #a855f7; font-size: 28px; margin: 0;">🎵 Music Batch Creator</h1>
        </div>
        <h2 style="color: #fff;">Password Reset Request</h2>
        <p style="color: #aaa;">Hi <strong style="color:#fff">${name}</strong>,</p>
        <p style="color: #aaa;">You requested a password reset. Click the button below to reset your password. This link expires in <strong style="color:#fff">10 minutes</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #a855f7; color: #fff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
        </div>
        <p style="color: #555; font-size: 12px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border-color: #222; margin: 20px 0;">
        <p style="color: #555; font-size: 12px; text-align: center;">Music Batch Creator · Secure Music Management</p>
      </div>
    `,
    message: `You requested a password reset. Please go to: ${resetUrl}`,
  }),

  welcome: (name, verifyUrl) => ({
    subject: "Welcome to Music Batch Creator! 🎵",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #a855f7; font-size: 28px; margin: 0;">🎵 Music Batch Creator</h1>
        </div>
        <h2 style="color: #fff;">Welcome, ${name}! 🎉</h2>
        <p style="color: #aaa;">Thanks for joining Music Batch Creator — your ultimate music management platform.</p>
        <p style="color: #aaa;">Please verify your email to unlock all features:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #a855f7; color: #fff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Verify Email</a>
        </div>
        <p style="color: #555; font-size: 12px;">This link expires in 24 hours.</p>
        <hr style="border-color: #222; margin: 20px 0;">
        <p style="color: #555; font-size: 12px; text-align: center;">Music Batch Creator · Secure Music Management</p>
      </div>
    `,
    message: `Welcome! Please verify your email: ${verifyUrl}`,
  }),
};

module.exports = { sendEmail, emailTemplates };
