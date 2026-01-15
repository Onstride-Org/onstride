const mongoose = require('mongoose');

// Notification Preferences
const notificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  pushEnabled: {
    type: Boolean,
    default: true
  },
  emailEnabled: {
    type: Boolean,
    default: true
  },
  tasks: {
    onAssigned: { type: Boolean, default: true },
    onDueSoon: { type: Boolean, default: true },
    onCompleted: { type: Boolean, default: true },
    onOverdue: { type: Boolean, default: true },
    reminderMinutesBefore: { type: Number, default: 60 }
  },
  invoices: {
    onCreated: { type: Boolean, default: true },
    onDueSoon: { type: Boolean, default: true },
    onPaid: { type: Boolean, default: true },
    onOverdue: { type: Boolean, default: true },
    reminderDaysBefore: { type: Number, default: 3 }
  },
  rideLogs: {
    onNewLog: { type: Boolean, default: false },
    dailySummary: { type: Boolean, default: false },
    weeklySummary: { type: Boolean, default: true }
  },
  lessons: {
    onRequested: { type: Boolean, default: true },
    onApproved: { type: Boolean, default: true },
    onCancelled: { type: Boolean, default: true },
    reminderMinutesBefore: { type: Number, default: 60 }
  },
  general: {
    appUpdates: { type: Boolean, default: true },
    newFeatures: { type: Boolean, default: true },
    quietHoursStart: { type: String, default: '22:00' },
    quietHoursEnd: { type: String, default: '07:00' }
  }
}, {
  timestamps: true
});

const NotificationPreferences = mongoose.model('NotificationPreferences', notificationPreferencesSchema);

// Notification (for notification history)
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['task', 'invoice', 'lesson', 'rideLog', 'system', 'vendor', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  body: String,
  action: String, // URL or deep link
  relatedEntityId: mongoose.Schema.Types.ObjectId,
  relatedEntityType: String,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  sentVia: [{
    type: String,
    enum: ['push', 'email', 'inApp']
  }]
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

// Device Token (for push notifications)
const deviceTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    required: true
  },
  deviceInfo: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

deviceTokenSchema.index({ userId: 1 });
deviceTokenSchema.index({ token: 1 }, { unique: true });

const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);

module.exports = {
  NotificationPreferences,
  Notification,
  DeviceToken
};
