const express = require('express');
const { body, param } = require('express-validator');
const RideLog = require('../models/RideLog');
const { authenticate, loadBarnContext, requireBarn, isStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(loadBarnContext);

// Get all ride logs
router.get('/', requireBarn, async (req, res, next) => {
  try {
    const { horseId, riderId, type, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {
      barnId: req.barnId,
      ...(horseId && { horseId }),
      ...(riderId && { riderId }),
      ...(type && { type }),
      ...(startDate && endDate && {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      })
    };

    const rideLogs = await RideLog.find(filter)
      .populate('horseId', 'name')
      .populate('riderId', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RideLog.countDocuments(filter);

    res.json({
      rideLogs,
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

// Get ride log by ID
router.get('/:id', async (req, res, next) => {
  try {
    const rideLog = await RideLog.findById(req.params.id)
      .populate('horseId', 'name')
      .populate('riderId', 'name');

    if (!rideLog) {
      return res.status(404).json({ error: 'Ride log not found' });
    }

    res.json(rideLog);
  } catch (error) {
    next(error);
  }
});

// Create ride log
router.post('/', [
  requireBarn,
  body('horseId').isMongoId(),
  body('date').isISO8601(),
  body('durationMinutes').isNumeric(),
  validate
], async (req, res, next) => {
  try {
    const { horseId, date, type, durationMinutes, riderId, riderName, notes } = req.body;

    // Get rider name if riderId provided
    let resolvedRiderName = riderName;
    if (riderId && !riderName) {
      const rider = await require('../models/User').findById(riderId);
      resolvedRiderName = rider?.name;
    }

    const rideLog = await RideLog.create({
      horseId,
      barnId: req.barnId,
      date,
      type: type || 'other',
      durationMinutes,
      riderId: riderId || req.userId,
      riderName: resolvedRiderName || req.user.name,
      notes,
      createdById: req.userId
    });

    const populated = await RideLog.findById(rideLog._id)
      .populate('horseId', 'name')
      .populate('riderId', 'name');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// Update ride log
router.put('/:id', [
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const rideLog = await RideLog.findById(req.params.id);
    if (!rideLog) {
      return res.status(404).json({ error: 'Ride log not found' });
    }

    // Check permission - creator or staff
    const isCreator = rideLog.createdById?.toString() === req.userId.toString();
    const userIsStaff = ['owner', 'admin', 'manager', 'trainer'].includes(req.user.accountType);

    if (!isCreator && !userIsStaff) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { date, type, durationMinutes, riderId, riderName, notes } = req.body;

    if (date) rideLog.date = date;
    if (type) rideLog.type = type;
    if (durationMinutes) rideLog.durationMinutes = durationMinutes;
    if (riderId) rideLog.riderId = riderId;
    if (riderName !== undefined) rideLog.riderName = riderName;
    if (notes !== undefined) rideLog.notes = notes;

    await rideLog.save();

    const populated = await RideLog.findById(rideLog._id)
      .populate('horseId', 'name')
      .populate('riderId', 'name');

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// Delete ride log
router.delete('/:id', [
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const rideLog = await RideLog.findById(req.params.id);
    if (!rideLog) {
      return res.status(404).json({ error: 'Ride log not found' });
    }

    // Check permission
    const isCreator = rideLog.createdById?.toString() === req.userId.toString();
    const userIsStaff = ['owner', 'admin', 'manager'].includes(req.user.accountType);

    if (!isCreator && !userIsStaff) {
      return res.status(403).json({ error: 'Access denied' });
    }

    rideLog.deletedAt = new Date();
    rideLog.deletedBy = req.userId;
    await rideLog.save();

    res.json({ message: 'Ride log deleted' });
  } catch (error) {
    next(error);
  }
});

// Get stats for a horse
router.get('/stats/:horseId', async (req, res, next) => {
  try {
    const stats = await RideLog.getStatsForHorse(req.params.horseId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get ride types breakdown
router.get('/stats/:horseId/by-type', async (req, res, next) => {
  try {
    const breakdown = await RideLog.aggregate([
      {
        $match: {
          horseId: require('mongoose').Types.ObjectId(req.params.horseId),
          deletedAt: null
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalMinutes: { $sum: '$durationMinutes' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(breakdown);
  } catch (error) {
    next(error);
  }
});

// Get recent activity for barn
router.get('/recent', requireBarn, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const recentLogs = await RideLog.find({ barnId: req.barnId })
      .populate('horseId', 'name')
      .populate('riderId', 'name')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json(recentLogs);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
