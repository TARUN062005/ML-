// server/utils/sendOTP.js
require("dotenv").config();
const twilio = require("twilio");

// Check environment variables
const { TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE } = process.env;

const isMock = !TWILIO_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE;

let client = null;
if (!isMock) {
  client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
} else {
  console.warn("⚠️ Twilio credentials missing. Using MOCK mode for OTP.");
}

/**
 * Send OTP to a phone number.
 * @param {string} phone - Recipient phone number (with country code, e.g. +91XXXXXXXXXX).
 * @param {string|number} otp - The OTP code to send.
 */
const sendOTP = async (phone, otp) => {
  if (isMock) {
    // Mock OTP sending in development/test
    console.log(`[MOCK OTP] To: ${phone}, Code: ${otp}`);
    return { success: true, mock: true };
  }

  try {
    const message = await client.messages.create({
      body: `🔐 Your OTP is: ${otp}\nIt will expire in 5 minutes.`,
      from: TWILIO_PHONE,
      to: phone,
    });

    console.log("📱 OTP sent successfully:", message.sid);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error("❌ OTP sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTP };
