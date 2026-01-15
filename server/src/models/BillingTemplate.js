const mongoose = require('mongoose');

const chargeTemplateSchema = new mongoose.Schema({
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
  }
}, { _id: true });

const billingTemplateSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  charges: [chargeTemplateSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

billingTemplateSchema.index({ barnId: 1, isActive: 1 });

// Calculate template total
billingTemplateSchema.virtual('total').get(function() {
  return this.charges.reduce((sum, charge) => sum + (charge.amount * charge.quantity), 0);
});

billingTemplateSchema.set('toJSON', { virtuals: true });
billingTemplateSchema.set('toObject', { virtuals: true });

const BillingTemplate = mongoose.model('BillingTemplate', billingTemplateSchema);

module.exports = BillingTemplate;
