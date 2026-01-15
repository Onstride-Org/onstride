const express = require('express');
const { body, param } = require('express-validator');
const { NotificationPreferences, Notification, DeviceToken } = require('../models/Notification');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

// Get notifications
router.get('/', async (req, res, next) => {
  try {
    const { unreadOnly, type, page = 1, limit = 20 } = req.query;

    const filter = {
      userId: req.userId,
      ...(unreadOnly === 'true' && { isRead: false }),
      ...(type && { type })
    };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      isRead: false
    });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.post('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

// Clear all notifications
router.delete('/', async (req, res, next) => {
  try {
    await Notification.deleteMany({ userId: req.userId });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    next(error);
  }
});

// ============ Preferences ============

// Get notification preferences
router.get('/preferences', async (req, res, next) => {
  try {
    let preferences = await NotificationPreferences.findOne({ userId: req.userId });

    if (!preferences) {
      preferences = await NotificationPreferences.create({ userId: req.userId });
    }

    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

// Update notification preferences
router.put('/preferences', async (req, res, next) => {
  try {
    const preferences = await NotificationPreferences.findOneAndUpdate(
      { userId: req.userId },
      req.body,
      { new: true, upsert: true }
    );

    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

// ============ Device Tokens ============

// Register device for push notifications
router.post('/register-device', [
  body('token').notEmpty(),
  body('platform').isIn(['ios', 'android', 'web']),
  validate
], async (req, res, next) => {
  try {
    const { token, platform, deviceInfo } = req.body;

    // Upsert device token
    const device = await DeviceToken.findOneAndUpdate(
      { token },
      {
        userId: req.userId,
        token,
        platform,
        deviceInfo,
        isActive: true
      },
      { new: true, upsert: true }
    );

    res.json(device);
  } catch (error) {
    next(error);
  }
});

// Unregister device
router.post('/unregister-device', [
  body('token').notEmpty(),
  validate
], async (req, res, next) => {
  try {
    await DeviceToken.findOneAndUpdate(
      { token: req.body.token, userId: req.userId },
      { isActive: false }
    );

    res.json({ message: 'Device unregistered' });
  } catch (error) {
    next(error);
  }
});

// ============ Send Notification (internal/admin use) ============

// This would typically be called internally, not exposed as API
const sendNotification = async (userId, notification) => {
  // Create notification record
  const notificationRecord = await Notification.create({
    userId,
    ...notification
  });

  // Get user's preferences
  const preferences = await NotificationPreferences.findOne({ userId });

  // Check if notifications are enabled for this type
  const shouldSendPush = preferences?.pushEnabled !== false;
  const shouldSendEmail = preferences?.emailEnabled !== false;

  // Get device tokens for push
  if (shouldSendPush) {
    const devices = await DeviceToken.find({ userId, isActive: true });
    // TODO: Send push notification via FCM/APNS
    // devices.forEach(device => sendPush(device.token, notification));
  }

  // Send email if enabled
  if (shouldSendEmail) {
    // TODO: Send email notification
  }

  return notificationRecord;
};

// Test notification (development only)
if (process.env.NODE_ENV !== 'production') {
  router.post('/test', async (req, res, next) => {
    try {
      const notification = await sendNotification(req.userId, {
        type: 'general',
        title: 'Test Notification',
        body: 'This is a test notification',
        action: '/dashboard'
      });

      res.json(notification);
    } catch (error) {
      next(error);
    }
  });
}

module.exports = router;
