// server/utils/sendEmail.js
const nodemailer = require("nodemailer");

/**
 * Creates a Nodemailer transporter configured for Gmail's SMTP server.
 * Requires EMAIL_USER and EMAIL_PASS (App Password) in .env.
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,        // Secure port with STARTTLS
  secure: false,    // false = STARTTLS, true = SSL (465)
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your 16-digit App Password
  },
});

/**
 * Sends an email using the pre-configured transporter.
 * @param {object} options - The email options.
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject line.
 * @param {string} options.text - Plain text email body.
 * @param {string} [options.html] - HTML email body (optional).
 * @returns {Promise<object>} Nodemailer response info.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Shop N Sell" <${process.env.EMAIL_USER}>`, // Sender name + email
      to,
      subject,
      text,
      html,
    });

    console.log("📧 Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw new Error("Email could not be sent.");
  }
};

module.exports = sendEmail;
