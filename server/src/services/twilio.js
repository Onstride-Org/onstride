/**
 * Twilio Verify Service for 2FA
 *
 * Uses Twilio Verify API for sending and validating OTP codes
 * Documentation: https://www.twilio.com/docs/verify/api
 */

const twilio = require('twilio');

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// Create Twilio client
let client = null;

const getClient = () => {
  if (!client && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return client;
};

/**
 * Check if Twilio Verify is configured
 */
const isConfigured = () => {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SERVICE_SID);
};

/**
 * Send verification code to phone number
 *
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +1234567890)
 * @param {string} channel - 'sms' or 'call' (default: 'sms')
 * @returns {Object} Verification status
 */
const sendVerificationCode = async (phoneNumber, channel = 'sms') => {
  if (!isConfigured()) {
    throw new Error('Twilio Verify is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID.');
  }

  const twilioClient = getClient();

  try {
    const verification = await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel: channel,
      });

    return {
      status: verification.status,
      to: verification.to,
      channel: verification.channel,
      valid: verification.status === 'pending',
    };
  } catch (error) {
    console.error('Twilio send verification error:', error.message);

    // Handle specific Twilio errors
    if (error.code === 60200) {
      throw new Error('Invalid phone number format. Please use E.164 format (e.g., +1234567890)');
    }
    if (error.code === 60203) {
      throw new Error('Max send attempts reached. Please wait before trying again.');
    }
    if (error.code === 60212) {
      throw new Error('Too many requests. Please wait before trying again.');
    }

    throw new Error(error.message || 'Failed to send verification code');
  }
};

/**
 * Verify the code entered by user
 *
 * @param {string} phoneNumber - Phone number in E.164 format
 * @param {string} code - 6-digit verification code
 * @returns {Object} Verification check result
 */
const verifyCode = async (phoneNumber, code) => {
  if (!isConfigured()) {
    throw new Error('Twilio Verify is not configured');
  }

  const twilioClient = getClient();

  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });

    return {
      status: verificationCheck.status,
      valid: verificationCheck.status === 'approved',
      to: verificationCheck.to,
    };
  } catch (error) {
    console.error('Twilio verify code error:', error.message);

    // Handle specific errors
    if (error.code === 60202) {
      throw new Error('Max check attempts reached. Please request a new code.');
    }
    if (error.code === 20404) {
      throw new Error('Verification code expired or not found. Please request a new code.');
    }

    throw new Error(error.message || 'Failed to verify code');
  }
};

/**
 * Format phone number to E.164 format
 *
 * @param {string} phoneNumber - Phone number in various formats
 * @param {string} defaultCountryCode - Default country code (default: '1' for US)
 * @returns {string} Phone number in E.164 format
 */
const formatPhoneNumber = (phoneNumber, defaultCountryCode = '1') => {
  // Remove all non-digit characters except leading +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // If already in E.164 format, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If starts with country code without +, add +
  if (cleaned.length > 10) {
    return '+' + cleaned;
  }

  // Assume US number if 10 digits
  if (cleaned.length === 10) {
    return '+' + defaultCountryCode + cleaned;
  }

  // Return with + prefix
  return '+' + cleaned;
};

/**
 * Validate phone number format
 *
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} Whether the phone number is valid
 */
const isValidPhoneNumber = (phoneNumber) => {
  // Basic E.164 validation: + followed by 10-15 digits
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  return e164Regex.test(phoneNumber);
};

module.exports = {
  isConfigured,
  sendVerificationCode,
  verifyCode,
  formatPhoneNumber,
  isValidPhoneNumber,
};
