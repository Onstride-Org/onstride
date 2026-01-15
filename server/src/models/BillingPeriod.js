const mongoose = require('mongoose');

const chargeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['board', 'lesson', 'training', 'farrier', 'vet', 'feed', 'supplies', 'service', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'billed', 'paid', 'cancelled', 'refunded'],
    default: 'pending'
  },
  horseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse'
  },
  horseName: String,
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

const billingPeriodSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  dueDate: Date,
  status: {
    type: String,
    enum: ['open', 'closed', 'invoiced', 'paid', 'partiallyPaid', 'overdue'],
    default: 'open'
  },
  charges: [chargeSchema],
  totalCharges: {
    type: Number,
    default: 0
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  previousBalance: {
    type: Number,
    default: 0
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  invoicedAt: Date,
  paidAt: Date,
  notes: String,
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

billingPeriodSchema.index({ barnId: 1, clientId: 1, startDate: -1 });
billingPeriodSchema.index({ status: 1 });

// Calculate total charges
billingPeriodSchema.methods.calculateTotal = function() {
  this.totalCharges = this.charges
    .filter(c => c.status !== 'cancelled' && c.status !== 'refunded')
    .reduce((sum, charge) => sum + (charge.amount * charge.quantity), 0);
  return this.totalCharges;
};

// Get balance due
billingPeriodSchema.virtual('balanceDue').get(function() {
  return this.totalCharges + this.previousBalance - this.amountPaid;
});

billingPeriodSchema.set('toJSON', { virtuals: true });
billingPeriodSchema.set('toObject', { virtuals: true });

const BillingPeriod = mongoose.model('BillingPeriod', billingPeriodSchema);

module.exports = BillingPeriod;
