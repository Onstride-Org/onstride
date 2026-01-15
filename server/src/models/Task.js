const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
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
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['notStarted', 'completed', 'overdue'],
    default: 'notStarted'
  },
  horses: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Horse'
    },
    name: String
  }],
  assignees: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    accountType: String
  }],
  sendReminder: {
    type: Boolean,
    default: true
  },
  reminderMinutesBefore: {
    type: Number,
    default: 60
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: Date,
  completedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

taskSchema.index({ barnId: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ 'assignees.id': 1, status: 1 });
taskSchema.index({ deletedAt: 1 });

// Check if task is overdue
taskSchema.methods.checkOverdue = function() {
  if (this.status === 'completed') return false;
  return new Date() > this.dueDate;
};

// Exclude soft-deleted tasks by default
taskSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ deletedAt: null });
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
