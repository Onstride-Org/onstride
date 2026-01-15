const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatarUrl: String,
  phoneNumber: String,
  accountType: {
    type: String,
    enum: ['owner', 'manager', 'boarder', 'groomer', 'admin', 'trainer', 'vendor'],
    default: 'boarder'
  },
  permissions: [{
    type: String,
    enum: ['userManagement', 'horseManagement', 'barnManagement', 'generateInvoices']
  }],
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  finishedRegistration: {
    type: Boolean,
    default: false
  },
  registrationMethod: {
    type: String,
    enum: ['email', 'phone', 'oauth', 'invitation'],
    default: 'email'
  },
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn'
  },
  refreshToken: {
    type: String,
    select: false
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLoginAt: Date,
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for soft delete queries
userSchema.index({ deletedAt: 1 });
userSchema.index({ email: 1, deletedAt: 1 });
userSchema.index({ barnId: 1, deletedAt: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user summary (for embedding in other documents)
userSchema.methods.toSummary = function() {
  return {
    id: this._id,
    name: this.name,
    accountType: this.accountType
  };
};

// Exclude soft-deleted users by default
userSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ deletedAt: null });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
