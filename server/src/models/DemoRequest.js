const mongoose = require('mongoose');
const crypto = require('crypto');

const demoRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  barnName: {
    type: String,
    trim: true
  },
  discipline: {
    type: String,
    trim: true
  },
  horseCount: {
    type: String,
    trim: true
  },
  isDecisionMaker: {
    type: String,
    enum: ['yes', 'no', ''],
    default: ''
  },
  selectedDate: {
    type: String
  },
  selectedTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'scheduled', 'completed', 'cancelled', 'email_sent', 'email_verified', 'account_created'],
    default: 'new'
  },
  notes: {
    type: String,
    trim: true
  },
  calendarEventId: {
    type: String,
    trim: true
  },
  meetLink: {
    type: String,
    trim: true
  },
  // Signup flow fields
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: {
    type: Date
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate verification token
demoRequestSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  return token;
};

module.exports = mongoose.model('DemoRequest', demoRequestSchema);
