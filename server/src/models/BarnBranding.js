const mongoose = require('mongoose');

const barnBrandingSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true,
    unique: true
  },
  logoUrl: String,
  logoIconUrl: String,
  primaryColor: {
    type: String,
    default: '#405D4B' // brand500
  },
  secondaryColor: {
    type: String,
    default: '#717171' // neutral500
  },
  accentColor: {
    type: String,
    default: '#A9EEC4' // brand100
  },
  backgroundColor: {
    type: String,
    default: '#FFFFFF'
  },
  headerTextColor: {
    type: String,
    default: '#1D1D1D' // neutral50
  },
  fontFamily: {
    type: String,
    default: 'Inter'
  },
  tagline: String,
  customDomain: String,
  domainVerified: {
    type: Boolean,
    default: false
  },
  welcomeMessage: String,
  emailFooter: String,
  invoiceHeader: String,
  invoiceFooter: String,
  socialMedia: {
    facebookUrl: String,
    instagramUrl: String,
    twitterUrl: String,
    youtubeUrl: String,
    websiteUrl: String
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const BarnBranding = mongoose.model('BarnBranding', barnBrandingSchema);

module.exports = BarnBranding;
