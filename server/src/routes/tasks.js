const express = require('express');
const { body, param } = require('express-validator');
const Task = require('../models/Task');
const { authenticate, loadBarnContext, requireBarn, hasPermission, isStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(loadBarnContext);

// Get all tasks
router.get('/', requireBarn, async (req, res, next) => {
  try {
    const { status, assigneeId, horseId, startDate, endDate, myTasks, page = 1, limit = 50 } = req.query;

    const filter = {
      barnId: req.barnId,
      ...(status && { status }),
      ...(horseId && { 'horses.id': horseId }),
      ...(startDate && endDate && {
        dueDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      })
    };

    // Filter by assignee
    if (myTasks === 'true') {
      filter['assignees.id'] = req.userId;
    } else if (assigneeId) {
      filter['assignees.id'] = assigneeId;
    }

    const tasks = await Task.find(filter)
      .sort({ dueDate: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Check for overdue tasks
    const now = new Date();
    tasks.forEach(task => {
      if (task.status !== 'completed' && task.dueDate < now) {
        task.status = 'overdue';
      }
    });

    const total = await Task.countDocuments(filter);

    res.json({
      tasks,
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

// Get task by ID
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Create task
router.post('/', [
  requireBarn,
  isStaff,
  body('name').trim().notEmpty(),
  body('dueDate').isISO8601(),
  validate
], async (req, res, next) => {
  try {
    const { name, description, dueDate, horses, assignees, sendReminder, reminderMinutesBefore } = req.body;

    const task = await Task.create({
      barnId: req.barnId,
      name,
      description,
      dueDate,
      horses: horses || [],
      assignees: assignees || [],
      sendReminder: sendReminder !== false,
      reminderMinutesBefore: reminderMinutesBefore || 60,
      createdById: req.userId
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:id', [
  isStaff,
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const { name, description, dueDate, horses, assignees, sendReminder, reminderMinutesBefore } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(dueDate && { dueDate }),
        ...(horses && { horses }),
        ...(assignees && { assignees }),
        ...(sendReminder !== undefined && { sendReminder }),
        ...(reminderMinutesBefore && { reminderMinutesBefore })
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Update task status
router.put('/:id/status', [
  param('id').isMongoId(),
  body('status').isIn(['notStarted', 'completed']),
  validate
], async (req, res, next) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is assigned or is staff
    const isAssigned = task.assignees.some(a => a.id.toString() === req.userId.toString());
    const userIsStaff = ['owner', 'admin', 'manager', 'groomer', 'trainer'].includes(req.user.accountType) ||
      (req.barnRole && ['owner', 'admin', 'manager', 'groomer', 'trainer'].includes(req.barnRole.role));

    if (!isAssigned && !userIsStaff) {
      return res.status(403).json({ error: 'Only assigned users or staff can update status' });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
      task.completedById = req.userId;
    } else {
      task.completedAt = null;
      task.completedById = null;
    }

    await task.save();

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Complete task (shorthand)
router.post('/:id/complete', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const isAssigned = task.assignees.some(a => a.id.toString() === req.userId.toString());
    const userIsStaff = ['owner', 'admin', 'manager', 'groomer', 'trainer'].includes(req.user.accountType);

    if (!isAssigned && !userIsStaff) {
      return res.status(403).json({ error: 'Only assigned users or staff can complete task' });
    }

    task.status = 'completed';
    task.completedAt = new Date();
    task.completedById = req.userId;
    await task.save();

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', [
  isStaff,
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        deletedAt: new Date(),
        deletedBy: req.userId
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
});

// Get tasks due today
router.get('/summary/today', requireBarn, async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      barnId: req.barnId,
      dueDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'completed' }
    }).sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Get overdue tasks count
router.get('/summary/overdue', requireBarn, async (req, res, next) => {
  try {
    const count = await Task.countDocuments({
      barnId: req.barnId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' }
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
