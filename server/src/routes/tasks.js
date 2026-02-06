const express = require('express');
const { body, param } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { Notification } = require('../models/Notification');
const { sendTaskApprovalEmail, sendTaskAssignmentEmail } = require('../services/email');
const { format } = require('date-fns');
const { authenticate, loadBarnContext, requireBarn, hasPermission, isStaff, restrictGroomer } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(loadBarnContext);
router.use((req, res, next) => {
  req.groomerResource = 'tasks';
  next();
});
router.use(restrictGroomer('tasks'));

// Get all tasks
router.get('/', requireBarn, async (req, res, next) => {
  try {
    const { status, assigneeId, horseId, startDate, endDate, myTasks, page = 1, limit = 50 } = req.query;
    const user = req.user;

    // Boarders can only see tasks assigned to them
    const isBoarder = user.accountType === 'boarder' ||
      (req.barnRole && req.barnRole.role === 'boarder');

    const filter = {
      barnId: req.barnId,
      ...(status && { status }),
      ...(horseId && { 'horses.id': horseId }),
      ...(startDate && endDate && {
        dueDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      })
    };

    // Boarders only see their own tasks
    if (isBoarder) {
      filter['assignees.id'] = req.userId;
    } else if (myTasks === 'true') {
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
      approvalStatus: assignees?.length ? 'pending' : 'approved',
      notificationSent: false,
      createdById: req.userId
    });

    // Send notifications and emails to assigned users
    if (assignees && assignees.length > 0) {
      const notifications = assignees.map(assignee => ({
        userId: assignee.id,
        type: 'task',
        title: 'New Task Assigned',
        body: `You have been assigned to: ${name}`,
        data: { taskId: task._id.toString() },
        action: `/app/calendar`
      }));

      await Notification.insertMany(notifications);

      // Send email notifications to assignees
      const creator = await User.findById(req.userId).select('name');
      const formattedDueDate = format(new Date(dueDate), 'EEEE, MMMM d, yyyy \'at\' h:mm a');

      // Get user emails for assignees
      const assigneeIds = assignees.map(a => a.id);
      const assigneeUsers = await User.find({ _id: { $in: assigneeIds } }).select('email name');

      for (const assigneeUser of assigneeUsers) {
        if (assigneeUser.email) {
          sendTaskAssignmentEmail({
            to: assigneeUser.email,
            recipientName: assigneeUser.name,
            task: {
              name,
              description,
              dueDate: formattedDueDate
            },
            createdByName: creator?.name
          }).catch(err => console.error('Failed to send task assignment email:', err));
        }
      }
    }

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
        ...(reminderMinutesBefore && { reminderMinutesBefore }),
        ...(assignees && { approvalStatus: assignees.length ? 'pending' : 'approved', notificationSent: false }),
        ...(dueDate && { notificationSent: false })
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

    if (task.approvalStatus && task.approvalStatus !== 'approved') {
      return res.status(400).json({ error: 'Task must be approved before updating status' });
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

// Respond to task assignment (approve/deny/reschedule)
router.put('/:id/approval', [
  param('id').isMongoId(),
  body('action').isIn(['approve', 'deny', 'reschedule']),
  body('proposedDate').optional().isISO8601(),
  validate
], async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const isAssigned = task.assignees.some(a => a.id.toString() === req.userId.toString());
    if (!isAssigned) {
      return res.status(403).json({ error: 'Only assigned users can respond' });
    }

    const { action, proposedDate, reason } = req.body;

    if (action === 'approve') {
      task.approvalStatus = 'approved';
      task.approvedAt = new Date();
      task.approvedById = req.userId;
      task.rescheduleProposedDate = null;
      task.denialReason = null;
    } else if (action === 'deny') {
      task.approvalStatus = 'denied';
      task.denialReason = reason || null;
      task.rescheduleProposedDate = null;
    } else if (action === 'reschedule') {
      if (!proposedDate) {
        return res.status(400).json({ error: 'Proposed date required for reschedule' });
      }
      task.approvalStatus = 'rescheduleRequested';
      task.rescheduleProposedDate = new Date(proposedDate);
      task.denialReason = null;
    }

    await task.save();

    const creator = await User.findById(task.createdById).select('name email');
    const assignee = task.assignees.find(a => a.id.toString() === req.userId.toString());
    const formattedDueDate = format(new Date(task.dueDate), 'EEEE, MMMM d, yyyy \'at\' h:mm a');
    const formattedProposedDate = task.rescheduleProposedDate
      ? format(new Date(task.rescheduleProposedDate), 'EEEE, MMMM d, yyyy \'at\' h:mm a')
      : null;

    const emailType = action === 'approve'
      ? 'approved'
      : action === 'deny'
        ? 'denied'
        : 'rescheduleRequested';

    if (creator?.email && assignee?.name) {
      sendTaskApprovalEmail({
        to: creator.email,
        recipientName: creator.name,
        type: emailType,
        task: {
          name: task.name,
          dueDate: formattedDueDate,
          assigneeName: assignee.name,
        },
        reason: action === 'deny' ? reason : undefined,
        proposedDate: formattedProposedDate,
      });
    }

    const notificationBodyMap = {
      approve: 'Task approved',
      deny: reason ? `Task denied: ${reason}` : 'Task denied',
      reschedule: formattedProposedDate ? `Reschedule requested for ${formattedProposedDate}` : 'Reschedule requested'
    };

    await Notification.create({
      userId: task.createdById,
      type: 'task',
      title: `Task ${emailType === 'approved' ? 'Approved' : emailType === 'denied' ? 'Denied' : 'Reschedule Requested'}`,
      body: notificationBodyMap[action] || 'Task updated',
      data: { taskId: task._id.toString() },
      action: '/app/calendar'
    });

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

    if (task.approvalStatus && task.approvalStatus !== 'approved') {
      return res.status(400).json({ error: 'Task must be approved before completing' });
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
