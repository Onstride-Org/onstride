const mongoose = require('mongoose');

const invoiceChargeSchema = new mongoose.Schema({
  description: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  type: {
    type: String,
    enum: ['board', 'lesson', 'training', 'farrier', 'vet', 'feed', 'supplies', 'service', 'other'],
    default: 'other'
  }
}, { _id: true });

const paymentBreakdownSchema = new mongoose.Schema({
  subtotal: Number,
  stripeFee: Number,       // Legacy - kept for backward compatibility
  processingFee: Number,   // Windcave processing fee
  platformFee: Number,
  total: Number
}, { _id: false });

const stripePaymentInfoSchema = new mongoose.Schema({
  paymentMethodType: String,
  last4Digits: String,
  paymentIntentId: String,
  chargeId: String
}, { _id: false });

const windcavePaymentInfoSchema = new mongoose.Schema({
  sessionId: String,
  transactionId: String,
  rrn: String,  // Retrieval Reference Number
  cardNumber: String,  // Masked
  cardType: String,
  responseCode: String,
  responseText: String
}, { _id: false });

const refundInfoSchema = new mongoose.Schema({
  transactionId: String,
  amount: Number,
  reason: String,
  refundedAt: Date,
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  boarderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Not required - can be null for guest invoices
  },
  // Guest invoice fields (for non-OnStride users)
  isGuestInvoice: {
    type: Boolean,
    default: false
  },
  guestEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  guestName: {
    type: String,
    trim: true
  },
  guestToken: {
    type: String,
    unique: true,
    sparse: true  // Allow multiple nulls
  },
  guestTokenExpiresAt: {
    type: Date
  },
  horseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse'
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  charges: [invoiceChargeSchema],
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['card', 'ach', 'cash', 'check', 'other']
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'starter', 'business', 'business_pro', 'enterprise', 'founders', null],
    default: null
  },
  subscriptionInterval: {
    type: String,
    enum: ['monthly', 'yearly', null],
    default: null
  },
  paymentBreakdown: paymentBreakdownSchema,
  stripePaymentInfo: stripePaymentInfoSchema,
  windcavePaymentInfo: windcavePaymentInfoSchema,
  refundInfo: refundInfoSchema,
  platformFeePercent: {
    type: Number,
    default: 2.5
  },
  failureReason: String,
  notes: String,
  paidAt: Date,
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

invoiceSchema.index({ barnId: 1, status: 1 });
invoiceSchema.index({ boarderId: 1, status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ deletedAt: 1 });
invoiceSchema.index({ guestToken: 1 });

// Calculate subtotal
invoiceSchema.virtual('subtotal').get(function() {
  if (!this.charges || !Array.isArray(this.charges)) {
    return 0;
  }
  return this.charges.reduce((sum, charge) => {
    return sum + ((charge.amount || 0) * (charge.quantity || 1));
  }, 0);
});

// Exclude soft-deleted invoices by default
invoiceSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ deletedAt: null });
  next();
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
