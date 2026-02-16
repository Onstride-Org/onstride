/**
 * Platform Settings Model
 *
 * Stores platform-wide configuration that can be updated by admins
 * Includes Stripe API keys for SaaS subscription payments
 */

const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const platformSettingsSchema = new mongoose.Schema({
  // Singleton key - only one settings document
  key: {
    type: String,
    default: 'platform_settings',
    unique: true,
    immutable: true,
  },

  // Stripe Configuration (encrypted)
  stripe: {
    secretKeyEncrypted: { type: String, select: false },
    publishableKey: String,
    webhookSecretEncrypted: { type: String, select: false },
    platformFeePercent: { type: Number, default: 2.5 },
    isConfigured: { type: Boolean, default: false },
    lastTestedAt: Date,
    testResult: {
      success: Boolean,
      message: String,
      testedAt: Date,
    },
  },

  // Other platform settings can be added here
  platformName: { type: String, default: 'OnStride' },
  supportEmail: { type: String, default: 'support@onstrideapp.com' },

  // Audit
  lastUpdatedBy: {
    type: String, // Admin email
  },
  lastUpdatedAt: Date,
}, {
  timestamps: true,
});

// Pre-save middleware to encrypt sensitive fields
platformSettingsSchema.pre('save', function(next) {
  // Encrypt Stripe secret key
  if (this.isModified('stripe.secretKeyEncrypted') &&
      this.stripe?.secretKeyEncrypted &&
      !this.stripe.secretKeyEncrypted.includes(':')) {
    this.stripe.secretKeyEncrypted = encrypt(this.stripe.secretKeyEncrypted);
  }

  // Encrypt webhook secret
  if (this.isModified('stripe.webhookSecretEncrypted') &&
      this.stripe?.webhookSecretEncrypted &&
      !this.stripe.webhookSecretEncrypted.includes(':')) {
    this.stripe.webhookSecretEncrypted = encrypt(this.stripe.webhookSecretEncrypted);
  }

  this.lastUpdatedAt = new Date();
  next();
});

// Method to get decrypted Stripe secret key
platformSettingsSchema.methods.getStripeSecretKey = function() {
  if (!this.stripe?.secretKeyEncrypted) return null;
  return decrypt(this.stripe.secretKeyEncrypted);
};

// Method to get decrypted webhook secret
platformSettingsSchema.methods.getStripeWebhookSecret = function() {
  if (!this.stripe?.webhookSecretEncrypted) return null;
  return decrypt(this.stripe.webhookSecretEncrypted);
};

// Method to mask a key for display (show last 8 chars)
platformSettingsSchema.methods.getMaskedSecretKey = function() {
  const key = this.getStripeSecretKey();
  if (!key) return null;
  if (key.length <= 12) return '****' + key.slice(-4);
  return key.slice(0, 7) + '...' + key.slice(-8);
};

// Static method to get or create singleton settings
platformSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ key: 'platform_settings' })
    .select('+stripe.secretKeyEncrypted +stripe.webhookSecretEncrypted');

  if (!settings) {
    settings = await this.create({ key: 'platform_settings' });
  }

  return settings;
};

// Static method to get settings for public use (no secrets)
platformSettingsSchema.statics.getPublicSettings = async function() {
  let settings = await this.findOne({ key: 'platform_settings' });

  if (!settings) {
    settings = await this.create({ key: 'platform_settings' });
  }

  return {
    stripe: {
      publishableKey: settings.stripe?.publishableKey,
      platformFeePercent: settings.stripe?.platformFeePercent,
      isConfigured: settings.stripe?.isConfigured,
    },
    platformName: settings.platformName,
    supportEmail: settings.supportEmail,
  };
};

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

module.exports = PlatformSettings;
