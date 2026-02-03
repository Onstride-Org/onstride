const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  horseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 60
  },
  price: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['privateSingle', 'privatePackage', 'groupLesson', 'training', 'assessment', 'other'],
    default: 'privateSingle'
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'countered', 'cancelled', 'completed'],
    default: 'requested'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  trainerName: String,
  clientName: String,
  horseName: String,
  location: String,
  notes: String,
  requestId: String,

  // Counter proposal
  counterProposedDate: Date,
  counterProposedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  counterNotes: String,

  // Recurrence
  recurringTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  recurrenceType: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'custom'],
    default: 'none'
  },
  recurrenceDays: [Number], // 0-6 for Sunday-Saturday
  recurrenceEndDate: Date,
  recurrenceCount: Number,

  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date
}, {
  timestamps: true
});

lessonSchema.index({ barnId: 1, scheduledDate: 1 });
lessonSchema.index({ trainerId: 1, scheduledDate: 1 });
lessonSchema.index({ clientId: 1, status: 1 });
lessonSchema.index({ status: 1, scheduledDate: 1 });
lessonSchema.index({ deletedAt: 1 });

// Exclude soft-deleted lessons by default
lessonSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ deletedAt: null });
  next();
});

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;
