const mongoose = require('mongoose');

const stallPositionSchema = new mongoose.Schema({
  stallName: String,
  horseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse'
  }
}, { _id: true });

const barnSetupSchema = new mongoose.Schema({
  shape: {
    type: String,
    enum: ['circle', 'lShape', 'aisles'],
    default: 'aisles'
  },
  stalls: {
    type: Number,
    default: 10
  },
  stallsPerAisle: Number,
  verticalStalls: Number,
  horizontalStalls: Number
}, { _id: false });

const barnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  setup: {
    type: barnSetupSchema,
    default: () => ({})
  },
  stallPositions: {
    type: Map,
    of: stallPositionSchema,
    default: new Map()
  },
  connectedAccountId: String, // Stripe Connect account
  // QuickBooks integration
  quickbooks: {
    accessToken: { type: String, select: false },
    refreshToken: { type: String, select: false },
    realmId: String,
    expiresAt: Date,
    refreshExpiresAt: Date,
    companyName: String,
    connectedAt: Date
  },
  address: String,
  city: String,
  state: String,
  zipCode: String,
  phoneNumber: String,
  email: String,
  website: String,
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

barnSchema.index({ ownerId: 1 });
barnSchema.index({ deletedAt: 1 });

// Exclude soft-deleted barns by default
barnSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ deletedAt: null });
  next();
});

// Get barn summary
barnSchema.methods.toSummary = function() {
  return {
    id: this._id,
    name: this.name
  };
};

const Barn = mongoose.model('Barn', barnSchema);

module.exports = Barn;
