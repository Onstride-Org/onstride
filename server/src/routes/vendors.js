const express = require('express');
const { body, param } = require('express-validator');
const { VendorProfile, BarnVendor, VendorAppointment } = require('../models/Vendor');
const { authenticate, loadBarnContext, requireBarn, isStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(loadBarnContext);

// ============ Vendor Profiles ============

// Search vendors
router.get('/search', async (req, res, next) => {
  try {
    const { type, city, state, query, page = 1, limit = 20 } = req.query;

    const filter = {
      ...(type && { $or: [{ primaryType: type }, { additionalTypes: type }] }),
      ...(city && { city: new RegExp(city, 'i') }),
      ...(state && { state: new RegExp(state, 'i') }),
      acceptingNewClients: true
    };

    if (query) {
      filter.$or = [
        { businessName: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') }
      ];
    }

    const vendors = await VendorProfile.find(filter)
      .sort({ rating: -1, reviewCount: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await VendorProfile.countDocuments(filter);

    res.json({
      vendors,
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

// Get vendor profile by ID
router.get('/:id', async (req, res, next) => {
  try {
    const vendor = await VendorProfile.findById(req.params.id)
      .populate('userId', 'name email avatarUrl');

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

// Create vendor profile (for current user)
router.post('/profile', [
  body('businessName').trim().notEmpty(),
  body('primaryType').isIn(['vet', 'farrier', 'dentist', 'bodyworker', 'trainer', 'supplier', 'transport', 'photographer', 'other']),
  validate
], async (req, res, next) => {
  try {
    // Check if user already has a vendor profile
    const existing = await VendorProfile.findOne({ userId: req.userId });
    if (existing) {
      return res.status(400).json({ error: 'Vendor profile already exists' });
    }

    const vendor = await VendorProfile.create({
      userId: req.userId,
      ...req.body
    });

    // Update user account type
    await require('../models/User').findByIdAndUpdate(req.userId, { accountType: 'vendor' });

    res.status(201).json(vendor);
  } catch (error) {
    next(error);
  }
});

// Update vendor profile
router.put('/profile', async (req, res, next) => {
  try {
    const vendor = await VendorProfile.findOneAndUpdate(
      { userId: req.userId },
      req.body,
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

// Get my vendor profile
router.get('/profile/me', async (req, res, next) => {
  try {
    const vendor = await VendorProfile.findOne({ userId: req.userId });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

// ============ Barn-Vendor Connections ============

// Get vendors connected to barn
router.get('/barn/connections', requireBarn, async (req, res, next) => {
  try {
    const { status } = req.query;

    const connections = await BarnVendor.find({
      barnId: req.barnId,
      ...(status && { status })
    }).populate({
      path: 'vendorId',
      populate: { path: 'userId', select: 'name email avatarUrl' }
    });

    res.json(connections);
  } catch (error) {
    next(error);
  }
});

// Request connection with vendor
router.post('/:vendorId/connect', [
  requireBarn,
  isStaff,
  param('vendorId').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const { services, notes } = req.body;

    // Check if connection already exists
    const existing = await BarnVendor.findOne({
      vendorId: req.params.vendorId,
      barnId: req.barnId
    });

    if (existing) {
      return res.status(400).json({ error: 'Connection already exists' });
    }

    const connection = await BarnVendor.create({
      vendorId: req.params.vendorId,
      barnId: req.barnId,
      status: 'pendingVendor',
      services,
      notes,
      addedBy: req.userId
    });

    res.status(201).json(connection);
  } catch (error) {
    next(error);
  }
});

// Accept/reject connection (vendor)
router.put('/connections/:id/respond', [
  param('id').isMongoId(),
  body('accept').isBoolean(),
  validate
], async (req, res, next) => {
  try {
    const connection = await BarnVendor.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Verify user is the vendor
    const vendor = await VendorProfile.findOne({ userId: req.userId });
    if (!vendor || vendor._id.toString() !== connection.vendorId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    connection.status = req.body.accept ? 'active' : 'inactive';
    await connection.save();

    res.json(connection);
  } catch (error) {
    next(error);
  }
});

// Remove connection
router.delete('/connections/:id', [
  requireBarn,
  isStaff
], async (req, res, next) => {
  try {
    const connection = await BarnVendor.findOneAndDelete({
      _id: req.params.id,
      barnId: req.barnId
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    res.json({ message: 'Connection removed' });
  } catch (error) {
    next(error);
  }
});

// ============ Appointments ============

// Get appointments
router.get('/appointments', requireBarn, async (req, res, next) => {
  try {
    const { vendorId, horseId, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {
      barnId: req.barnId,
      ...(vendorId && { vendorId }),
      ...(horseId && { horseId }),
      ...(status && { status }),
      ...(startDate && endDate && {
        scheduledDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      })
    };

    const appointments = await VendorAppointment.find(filter)
      .populate({
        path: 'vendorId',
        populate: { path: 'userId', select: 'name' }
      })
      .populate('horseId', 'name')
      .sort({ scheduledDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await VendorAppointment.countDocuments(filter);

    res.json({
      appointments,
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

// Get vendor's appointments (for vendors)
router.get('/appointments/mine', async (req, res, next) => {
  try {
    const vendor = await VendorProfile.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    const { status, startDate, endDate } = req.query;

    const filter = {
      vendorId: vendor._id,
      ...(status && { status }),
      ...(startDate && endDate && {
        scheduledDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      })
    };

    const appointments = await VendorAppointment.find(filter)
      .populate('barnId', 'name')
      .populate('horseId', 'name')
      .sort({ scheduledDate: 1 });

    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

// Create appointment
router.post('/appointments', [
  requireBarn,
  isStaff,
  body('vendorId').isMongoId(),
  body('scheduledDate').isISO8601(),
  validate
], async (req, res, next) => {
  try {
    const { vendorId, horseId, scheduledDate, durationMinutes, type, price, notes } = req.body;

    // Get horse name if provided
    let horseName;
    if (horseId) {
      const horse = await require('../models/Horse').findById(horseId);
      horseName = horse?.name;
    }

    const appointment = await VendorAppointment.create({
      vendorId,
      barnId: req.barnId,
      horseId,
      horseName,
      scheduledDate,
      durationMinutes: durationMinutes || 60,
      type,
      price,
      notes,
      status: 'requested',
      createdById: req.userId
    });

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
});

// Update appointment status
router.put('/appointments/:id/status', [
  param('id').isMongoId(),
  body('status').isIn(['confirmed', 'inProgress', 'completed', 'cancelled', 'noShow']),
  validate
], async (req, res, next) => {
  try {
    const appointment = await VendorAppointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check permission - vendor or barn staff
    const vendor = await VendorProfile.findOne({ userId: req.userId });
    const isVendor = vendor && vendor._id.toString() === appointment.vendorId.toString();
    const isBarnStaff = appointment.barnId.toString() === req.barnId?.toString() &&
      ['owner', 'admin', 'manager'].includes(req.user.accountType);

    if (!isVendor && !isBarnStaff) {
      return res.status(403).json({ error: 'Access denied' });
    }

    appointment.status = req.body.status;
    if (req.body.completionNotes) {
      appointment.completionNotes = req.body.completionNotes;
    }
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

// Update appointment
router.put('/appointments/:id', [
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const appointment = await VendorAppointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const { scheduledDate, durationMinutes, horseId, type, price, notes } = req.body;

    if (scheduledDate) appointment.scheduledDate = scheduledDate;
    if (durationMinutes) appointment.durationMinutes = durationMinutes;
    if (horseId) {
      appointment.horseId = horseId;
      const horse = await require('../models/Horse').findById(horseId);
      appointment.horseName = horse?.name;
    }
    if (type) appointment.type = type;
    if (price !== undefined) appointment.price = price;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

// Delete appointment
router.delete('/appointments/:id', [
  isStaff
], async (req, res, next) => {
  try {
    const appointment = await VendorAppointment.findOneAndDelete({
      _id: req.params.id,
      barnId: req.barnId
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
