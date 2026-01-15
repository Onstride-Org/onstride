const mongoose = require('mongoose');

const userBarnRoleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'groomer', 'boarder', 'trainer', 'vendor'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  permissions: [{
    type: String,
    enum: ['userManagement', 'horseManagement', 'barnManagement', 'generateInvoices']
  }],
  title: String,
  isPrimary: {
    type: Boolean,
    default: false
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  barnName: String,
  userName: String
}, {
  timestamps: true
});

userBarnRoleSchema.index({ userId: 1, barnId: 1 }, { unique: true });
userBarnRoleSchema.index({ userId: 1, isPrimary: 1 });
userBarnRoleSchema.index({ barnId: 1, status: 1 });

// Get user's primary barn
userBarnRoleSchema.statics.getPrimaryBarn = async function(userId) {
  const role = await this.findOne({ userId, isPrimary: true, status: 'active' })
    .populate('barnId');
  return role?.barnId;
};

// Get all barns for a user
userBarnRoleSchema.statics.getUserBarns = async function(userId) {
  return this.find({ userId, status: 'active' })
    .populate('barnId')
    .sort({ isPrimary: -1, joinedAt: 1 });
};

// Get all users for a barn
userBarnRoleSchema.statics.getBarnUsers = async function(barnId) {
  return this.find({ barnId, status: 'active' })
    .populate('userId')
    .sort({ role: 1, joinedAt: 1 });
};

const UserBarnRole = mongoose.model('UserBarnRole', userBarnRoleSchema);

module.exports = UserBarnRole;
