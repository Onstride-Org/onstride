const mongoose = require('mongoose');

const horseTransferSchema = new mongoose.Schema({
  horseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse',
    required: true
  },
  horseName: String,
  fromBarnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  fromBarnName: String,
  toBarnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  toBarnName: String,
  transferredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transferredAt: {
    type: Date,
    default: Date.now
  },
  reason: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: String
}, {
  timestamps: true
});

horseTransferSchema.index({ horseId: 1 });
horseTransferSchema.index({ fromBarnId: 1 });
horseTransferSchema.index({ toBarnId: 1 });
horseTransferSchema.index({ status: 1 });

const HorseTransfer = mongoose.model('HorseTransfer', horseTransferSchema);

module.exports = HorseTransfer;
