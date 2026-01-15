const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const invitationSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  barnName: String,
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['owner', 'manager', 'boarder', 'groomer', 'admin', 'trainer', 'vendor'],
    required: true
  },
  permissions: [{
    type: String,
    enum: ['userManagement', 'horseManagement', 'barnManagement', 'generateInvoices']
  }],
  token: {
    type: String,
    default: () => uuidv4(),
    unique: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  active: {
    type: Boolean,
    default: true
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  acceptedAt: Date,
  acceptedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

invitationSchema.index({ token: 1 });
invitationSchema.index({ barnId: 1, active: 1 });
invitationSchema.index({ email: 1, active: 1 });
invitationSchema.index({ expiresAt: 1 });

// Check if invitation is valid
invitationSchema.methods.isValid = function() {
  return this.active && new Date() < this.expiresAt;
};

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;
