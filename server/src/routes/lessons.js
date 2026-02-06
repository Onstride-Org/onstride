const express = require('express');
const { body, param } = require('express-validator');
const Lesson = require('../models/Lesson');
const TrainerAvailability = require('../models/TrainerAvailability');
const User = require('../models/User');
const { authenticate, loadBarnContext, requireBarn, hasPermission, hasRole, restrictGroomer } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sendLessonNotificationEmail } = require('../services/email');
const { format } = require('date-fns');

// Helper to format lesson for email notification
const formatLessonForEmail = (lesson) => ({
  date: format(new Date(lesson.scheduledDate), 'EEEE, MMMM d, yyyy \'at\' h:mm a'),
  duration: lesson.durationMinutes || 60,
  type: lesson.type,
  trainer: lesson.trainerName || 'Unknown',
  client: lesson.clientName || 'Unknown',
  horse: lesson.horseName || null,
  location: lesson.location || null,
});

// Helper to send lesson notification
const sendLessonNotification = async (lesson, type, options = {}) => {
  try {
    const lessonData = formatLessonForEmail(lesson);

    // Get trainer and client details
    const [trainer, client] = await Promise.all([
      User.findById(lesson.trainerId).select('name email'),
      User.findById(lesson.clientId).select('name email'),
    ]);

    if (!trainer || !client) return;

    // Determine recipients based on notification type
    switch (type) {
      case 'requested':
        // Notify trainer about new request
        await sendLessonNotificationEmail({
          to: trainer.email,
          recipientName: trainer.name,
          type,
          lesson: { ...lessonData, trainer: trainer.name, client: client.name },
        });
        break;

      case 'approved':
      case 'rejected':
      case 'countered':
        // Notify client about decision
        await sendLessonNotificationEmail({
          to: client.email,
          recipientName: client.name,
          type,
          lesson: { ...lessonData, trainer: trainer.name, client: client.name },
          reason: options.reason,
          proposedDate: options.proposedDate ? format(new Date(options.proposedDate), 'EEEE, MMMM d, yyyy \'at\' h:mm a') : null,
        });
        break;

      case 'cancelled':
        // Notify the other party (whoever didn't cancel)
        const cancelledBy = options.cancelledById;
        const recipientIsClient = cancelledBy === lesson.trainerId.toString();
        const recipient = recipientIsClient ? client : trainer;
        await sendLessonNotificationEmail({
          to: recipient.email,
          recipientName: recipient.name,
          type,
          lesson: { ...lessonData, trainer: trainer.name, client: client.name },
          reason: options.reason,
        });
        break;
    }
  } catch (error) {
    console.error('Failed to send lesson notification:', error);
    // Don't throw - notification failure shouldn't break the API
  }
};

const router = express.Router();

router.use(authenticate);
router.use(loadBarnContext);
router.use((req, res, next) => {
  req.groomerResource = 'lessons';
  next();
});
router.use(restrictGroomer('tasks', 'horses'));

// Get all lessons
router.get('/', requireBarn, async (req, res, next) => {
  try {
    const { status, trainerId, clientId, startDate, endDate, type, page = 1, limit = 50 } = req.query;
    const user = req.user;

    // Build filter based on user role
    const filter = {
      barnId: req.barnId,
      ...(status && { status }),
      ...(type && { type }),
      ...(startDate && endDate && {
        scheduledDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      })
    };

    // Trainers see their lessons, boarders see their requests
    if (user.accountType === 'trainer' || (req.barnRole && req.barnRole.role === 'trainer')) {
      if (!trainerId) filter.trainerId = req.userId;
      else filter.trainerId = trainerId;
    } else if (user.accountType === 'boarder' || (req.barnRole && req.barnRole.role === 'boarder')) {
      filter.clientId = req.userId;
    } else {
      // Staff can filter by trainer or client
      if (trainerId) filter.trainerId = trainerId;
      if (clientId) filter.clientId = clientId;
    }

    const lessons = await Lesson.find(filter)
      .populate('trainerId', 'name email')
      .populate('clientId', 'name email')
      .populate('horseId', 'name')
      .sort({ scheduledDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Lesson.countDocuments(filter);

    res.json({
      lessons,
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

// Get lesson by ID
router.get('/:id', async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('trainerId', 'name email avatarUrl')
      .populate('clientId', 'name email avatarUrl')
      .populate('horseId', 'name');

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json(lesson);
  } catch (error) {
    next(error);
  }
});

// Create lesson request (clients)
router.post('/request', [
  requireBarn,
  body('trainerId').isMongoId(),
  body('scheduledDate').isISO8601(),
  validate
], async (req, res, next) => {
  try {
    const {
      trainerId, scheduledDate, durationMinutes, type, horseId, horseName,
      location, notes
    } = req.body;

    // Get trainer name
    const trainer = await User.findById(trainerId);

    const lesson = await Lesson.create({
      barnId: req.barnId,
      trainerId,
      trainerName: trainer?.name,
      clientId: req.userId,
      clientName: req.user.name,
      horseId,
      horseName,
      scheduledDate,
      durationMinutes: durationMinutes || 60,
      type: type || 'privateSingle',
      status: 'requested',
      reminderSent: false,
      location,
      notes,
      createdById: req.userId
    });

    const populated = await Lesson.findById(lesson._id)
      .populate('trainerId', 'name email')
      .populate('horseId', 'name');

    // Send notification to trainer about new request
    sendLessonNotification(lesson, 'requested');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// Create lesson directly (trainers/staff)
router.post('/', [
  requireBarn,
  hasRole('owner', 'admin', 'manager', 'trainer'),
  body('clientId').isMongoId(),
  body('scheduledDate').isISO8601(),
  validate
], async (req, res, next) => {
  try {
    const {
      clientId, scheduledDate, durationMinutes, type, price,
      horseId, horseName, location, notes,
      recurrenceType, recurrenceDays, recurrenceEndDate, recurrenceCount
    } = req.body;

    const trainerId = req.body.trainerId || req.userId;

    // Get names
    const [trainer, client] = await Promise.all([
      User.findById(trainerId),
      User.findById(clientId)
    ]);

    const lesson = await Lesson.create({
      barnId: req.barnId,
      trainerId,
      trainerName: trainer?.name,
      clientId,
      clientName: client?.name,
      horseId,
      horseName,
      scheduledDate,
      durationMinutes: durationMinutes || 60,
      type: type || 'privateSingle',
      price: price || 0,
      status: 'approved',
      reminderSent: false,
      location,
      notes,
      recurrenceType: recurrenceType || 'none',
      recurrenceDays,
      recurrenceEndDate,
      recurrenceCount,
      createdById: req.userId
    });

    // Generate recurring lessons if needed
    if (recurrenceType && recurrenceType !== 'none') {
      await generateRecurringLessons(lesson);
    }

    const populated = await Lesson.findById(lesson._id)
      .populate('trainerId', 'name email')
      .populate('clientId', 'name email')
      .populate('horseId', 'name');

    // Send email notification to client about the scheduled lesson
    sendLessonNotification(lesson, 'approved');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// Helper function to generate recurring lessons
async function generateRecurringLessons(templateLesson) {
  const lessons = [];
  let currentDate = new Date(templateLesson.scheduledDate);
  const endDate = templateLesson.recurrenceEndDate || new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days default
  const maxLessons = templateLesson.recurrenceCount || 52;

  while (currentDate <= endDate && lessons.length < maxLessons) {
    // Skip the original lesson date
    if (lessons.length > 0 || currentDate > new Date(templateLesson.scheduledDate)) {
      const lessonData = {
        ...templateLesson.toObject(),
        _id: undefined,
        scheduledDate: new Date(currentDate),
        recurringTemplateId: templateLesson._id,
        recurrenceType: 'none' // Don't recurse
      };
      delete lessonData.createdAt;
      delete lessonData.updatedAt;
      lessons.push(lessonData);
    }

    // Advance date based on recurrence type
    switch (templateLesson.recurrenceType) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'custom':
        // Find next day in recurrenceDays
        let found = false;
        for (let i = 1; i <= 7 && !found; i++) {
          currentDate.setDate(currentDate.getDate() + 1);
          if (templateLesson.recurrenceDays.includes(currentDate.getDay())) {
            found = true;
          }
        }
        break;
    }
  }

  if (lessons.length > 0) {
    await Lesson.insertMany(lessons);
  }
}

// Update lesson
router.put('/:id', [
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Check permission
    const isTrainer = lesson.trainerId.toString() === req.userId.toString();
    const isClient = lesson.clientId.toString() === req.userId.toString();
    const isStaff = ['owner', 'admin', 'manager'].includes(req.user.accountType);

    if (!isTrainer && !isClient && !isStaff) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { scheduledDate, durationMinutes, type, price, location, notes } = req.body;

    if (scheduledDate) lesson.scheduledDate = scheduledDate;
    if (durationMinutes) lesson.durationMinutes = durationMinutes;
    if (type) lesson.type = type;
    if (price !== undefined) lesson.price = price;
    if (location !== undefined) lesson.location = location;
    if (notes !== undefined) lesson.notes = notes;

    await lesson.save();

    const populated = await Lesson.findById(lesson._id)
      .populate('trainerId', 'name email')
      .populate('clientId', 'name email')
      .populate('horseId', 'name');

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// Approve lesson request
router.put('/:id/approve', [
  hasRole('owner', 'admin', 'manager', 'trainer')
], async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Trainers can only approve their own lessons
    if (req.user.accountType === 'trainer' && lesson.trainerId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Can only approve your own lessons' });
    }

    lesson.status = 'approved';
    lesson.reminderSent = false;
    await lesson.save();

    // Send notification to client about approval
    sendLessonNotification(lesson, 'approved');

    const populated = await Lesson.findById(lesson._id)
      .populate('trainerId', 'name email')
      .populate('clientId', 'name email')
      .populate('horseId', 'name');

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// Reject lesson request
router.put('/:id/reject', [
  hasRole('owner', 'admin', 'manager', 'trainer')
], async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (req.user.accountType === 'trainer' && lesson.trainerId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Can only reject your own lessons' });
    }

    lesson.status = 'rejected';
    lesson.reminderSent = false;
    lesson.notes = req.body.reason || lesson.notes;
    await lesson.save();

    // Send notification to client about rejection
    sendLessonNotification(lesson, 'rejected', { reason: req.body.reason });

    const populated = await Lesson.findById(lesson._id)
      .populate('trainerId', 'name email')
      .populate('clientId', 'name email')
      .populate('horseId', 'name');

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// Counter-propose different time
router.put('/:id/counter', [
  hasRole('owner', 'admin', 'manager', 'trainer'),
  body('proposedDate').isISO8601(),
  validate
], async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    lesson.status = 'countered';
    lesson.reminderSent = false;
    lesson.counterProposedDate = req.body.proposedDate;
    lesson.counterProposedBy = req.userId;
    lesson.counterNotes = req.body.notes;
    await lesson.save();

    // Send notification to client about counter-proposal
    sendLessonNotification(lesson, 'countered', { proposedDate: req.body.proposedDate });

    const populated = await Lesson.findById(lesson._id)
      .populate('trainerId', 'name email')
      .populate('clientId', 'name email')
      .populate('horseId', 'name');

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// Complete lesson
router.put('/:id/complete', [
  hasRole('owner', 'admin', 'manager', 'trainer')
], async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    lesson.status = 'completed';
    lesson.reminderSent = true;
    await lesson.save();

    res.json(lesson);
  } catch (error) {
    next(error);
  }
});

// Cancel lesson
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Check permission
    const isTrainer = lesson.trainerId.toString() === req.userId.toString();
    const isClient = lesson.clientId.toString() === req.userId.toString();
    const isStaff = ['owner', 'admin', 'manager'].includes(req.user.accountType);

    if (!isTrainer && !isClient && !isStaff) {
      return res.status(403).json({ error: 'Access denied' });
    }

    lesson.status = 'cancelled';
    lesson.reminderSent = true;
    lesson.notes = req.body.reason || lesson.notes;
    await lesson.save();

    // Send notification to the other party about cancellation
    sendLessonNotification(lesson, 'cancelled', {
      reason: req.body.reason,
      cancelledById: req.userId.toString()
    });

    const populated = await Lesson.findById(lesson._id)
      .populate('trainerId', 'name email')
      .populate('clientId', 'name email')
      .populate('horseId', 'name');

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// Delete lesson
router.delete('/:id', [
  hasRole('owner', 'admin', 'manager', 'trainer')
], async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    next(error);
  }
});

// ============ Trainer Availability ============

// Get trainer availability
router.get('/availability/:trainerId', async (req, res, next) => {
  try {
    const availability = await TrainerAvailability.find({
      trainerId: req.params.trainerId,
      barnId: req.barnId
    }).sort({ dayOfWeek: 1 });

    res.json(availability);
  } catch (error) {
    next(error);
  }
});

// Set trainer availability
router.put('/availability/:trainerId', [
  hasRole('owner', 'admin', 'manager', 'trainer'),
  body('availability').isArray(),
  validate
], async (req, res, next) => {
  try {
    const trainerId = req.params.trainerId;

    // Trainers can only update their own availability
    if (req.user.accountType === 'trainer' && trainerId !== req.userId.toString()) {
      return res.status(403).json({ error: 'Can only update your own availability' });
    }

    // Delete existing availability
    await TrainerAvailability.deleteMany({ trainerId, barnId: req.barnId });

    // Create new availability
    const availability = await TrainerAvailability.insertMany(
      req.body.availability.map(a => ({
        trainerId,
        barnId: req.barnId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isAvailable: a.isAvailable !== false
      }))
    );

    res.json(availability);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
