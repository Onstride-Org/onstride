const express = require('express');
const { body, param } = require('express-validator');
const Barn = require('../models/Barn');
const BarnBranding = require('../models/BarnBranding');
const BarnLayout = require('../models/BarnLayout');
const UserBarnRole = require('../models/UserBarnRole');
const Horse = require('../models/Horse');
const { BarnSubscription } = require('../models/Subscription');
const { authenticate, loadBarnContext, requireBarn, hasPermission, hasRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadImage, uploadToCloud } = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);
router.use(loadBarnContext);

// Get all barns for current user
router.get('/', async (req, res, next) => {
  try {
    const barnRoles = await UserBarnRole.find({
      userId: req.userId,
      status: 'active'
    }).populate('barnId');

    const barns = await Promise.all(
      barnRoles.map(async (role) => {
        const horseCount = await Horse.countDocuments({ barnId: role.barnId._id });
        const userCount = await UserBarnRole.countDocuments({ barnId: role.barnId._id, status: 'active' });

        return {
          id: role.barnId._id,
          name: role.barnId.name,
          role: role.role,
          isPrimary: role.isPrimary,
          horseCount,
          userCount
        };
      })
    );

    res.json(barns);
  } catch (error) {
    next(error);
  }
});

// Create new barn
router.post('/', [
  body('name').trim().notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const { name, setup } = req.body;

    // Check subscription limits
    const existingBarnCount = await UserBarnRole.countDocuments({
      userId: req.userId,
      role: 'owner',
      status: 'active'
    });

    // TODO: Check subscription tier for max barns

    const barn = await Barn.create({
      name,
      ownerId: req.userId,
      setup
    });

    // Create user-barn role
    await UserBarnRole.create({
      userId: req.userId,
      barnId: barn._id,
      role: 'owner',
      isPrimary: existingBarnCount === 0,
      barnName: barn.name,
      userName: req.user.name
    });

    // Create default subscription
    await BarnSubscription.create({
      barnId: barn._id,
      tier: 'free',
      status: 'active'
    });

    // Create default branding
    await BarnBranding.create({ barnId: barn._id });

    res.status(201).json(barn);
  } catch (error) {
    next(error);
  }
});

// Get barn by ID
router.get('/:id', async (req, res, next) => {
  try {
    const barn = await Barn.findById(req.params.id);
    if (!barn) {
      return res.status(404).json({ error: 'Barn not found' });
    }

    // Check access
    const hasAccess = await UserBarnRole.findOne({
      userId: req.userId,
      barnId: barn._id,
      status: 'active'
    });

    if (!hasAccess && req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'No access to this barn' });
    }

    // Get stats
    const [horseCount, userCount, subscription] = await Promise.all([
      Horse.countDocuments({ barnId: barn._id }),
      UserBarnRole.countDocuments({ barnId: barn._id, status: 'active' }),
      BarnSubscription.findOne({ barnId: barn._id })
    ]);

    res.json({
      ...barn.toObject(),
      horseCount,
      userCount,
      subscription: subscription ? {
        tier: subscription.tier,
        status: subscription.status
      } : null
    });
  } catch (error) {
    next(error);
  }
});

// Update barn
router.put('/:id', [
  hasPermission('barnManagement'),
  body('name').optional().trim().notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const { name, setup, address, city, state, zipCode, phoneNumber, email, website } = req.body;

    const barn = await Barn.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(setup && { setup }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zipCode !== undefined && { zipCode }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website })
      },
      { new: true }
    );

    if (!barn) {
      return res.status(404).json({ error: 'Barn not found' });
    }

    res.json(barn);
  } catch (error) {
    next(error);
  }
});

// Get barn members
router.get('/:id/members', async (req, res, next) => {
  try {
    const members = await UserBarnRole.getBarnUsers(req.params.id);

    res.json(members.map(m => ({
      id: m.userId._id,
      name: m.userId.name,
      email: m.userId.email,
      avatarUrl: m.userId.avatarUrl,
      role: m.role,
      permissions: m.permissions,
      title: m.title,
      joinedAt: m.joinedAt
    })));
  } catch (error) {
    next(error);
  }
});

// Update stall assignments
router.put('/:id/stalls', [
  hasPermission('barnManagement'),
  validate
], async (req, res, next) => {
  try {
    const { stallPositions } = req.body;

    const barn = await Barn.findByIdAndUpdate(
      req.params.id,
      { stallPositions },
      { new: true }
    );

    if (!barn) {
      return res.status(404).json({ error: 'Barn not found' });
    }

    res.json(barn.stallPositions);
  } catch (error) {
    next(error);
  }
});

// Get barn layout
router.get('/:id/layout', async (req, res, next) => {
  try {
    let layout = await BarnLayout.findOne({ barnId: req.params.id });

    if (!layout) {
      // Create default layout
      layout = await BarnLayout.create({
        barnId: req.params.id,
        createdBy: req.userId
      });
    }

    res.json(layout);
  } catch (error) {
    next(error);
  }
});

// Update barn layout
router.put('/:id/layout', [
  hasPermission('barnManagement'),
  validate
], async (req, res, next) => {
  try {
    const { elements, canvasWidth, canvasHeight, showLabels, showHorseNames, backgroundColor } = req.body;

    let layout = await BarnLayout.findOne({ barnId: req.params.id });

    if (!layout) {
      layout = new BarnLayout({ barnId: req.params.id, createdBy: req.userId });
    }

    if (elements) layout.elements = elements;
    if (canvasWidth) layout.canvasWidth = canvasWidth;
    if (canvasHeight) layout.canvasHeight = canvasHeight;
    if (showLabels !== undefined) layout.showLabels = showLabels;
    if (showHorseNames !== undefined) layout.showHorseNames = showHorseNames;
    if (backgroundColor) layout.backgroundColor = backgroundColor;
    layout.version += 1;

    await layout.save();

    res.json(layout);
  } catch (error) {
    next(error);
  }
});

// Get barn branding
router.get('/:id/branding', async (req, res, next) => {
  try {
    let branding = await BarnBranding.findOne({ barnId: req.params.id });

    if (!branding) {
      branding = await BarnBranding.create({ barnId: req.params.id });
    }

    res.json(branding);
  } catch (error) {
    next(error);
  }
});

// Update barn branding
router.put('/:id/branding', [
  hasPermission('barnManagement'),
  validate
], async (req, res, next) => {
  try {
    const branding = await BarnBranding.findOneAndUpdate(
      { barnId: req.params.id },
      { ...req.body, updatedBy: req.userId },
      { new: true, upsert: true }
    );

    res.json(branding);
  } catch (error) {
    next(error);
  }
});

// Upload branding logo
router.post('/:id/branding/logo', [
  hasPermission('barnManagement'),
  uploadImage.single('logo'),
  uploadToCloud('logos')
], async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Use cloud URL if available, otherwise fallback to local path
    const logoUrl = req.file.cloudUrl || `/uploads/${req.file.filename}`;
    const branding = await BarnBranding.findOneAndUpdate(
      { barnId: req.params.id },
      { logoUrl, updatedBy: req.userId },
      { new: true, upsert: true }
    );

    res.json({ logoUrl: branding.logoUrl });
  } catch (error) {
    next(error);
  }
});

// Switch primary barn
router.post('/switch-primary/:id', async (req, res, next) => {
  try {
    // Verify user has access to barn
    const role = await UserBarnRole.findOne({
      userId: req.userId,
      barnId: req.params.id,
      status: 'active'
    });

    if (!role) {
      return res.status(403).json({ error: 'No access to this barn' });
    }

    // Clear current primary
    await UserBarnRole.updateMany(
      { userId: req.userId },
      { isPrimary: false }
    );

    // Set new primary
    role.isPrimary = true;
    await role.save();

    // Update user's default barn
    await require('../models/User').findByIdAndUpdate(req.userId, { barnId: req.params.id });

    res.json({ message: 'Primary barn updated' });
  } catch (error) {
    next(error);
  }
});

// Delete barn (soft delete)
router.delete('/:id', [
  hasRole('owner'),
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const barn = await Barn.findById(req.params.id);
    if (!barn) {
      return res.status(404).json({ error: 'Barn not found' });
    }

    if (barn.ownerId.toString() !== req.userId.toString() && req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'Only owner can delete barn' });
    }

    barn.deletedAt = new Date();
    barn.deletedBy = req.userId;
    await barn.save();

    res.json({ message: 'Barn deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
