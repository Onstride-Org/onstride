const express = require('express');
const { body, param } = require('express-validator');
const User = require('../models/User');
const UserBarnRole = require('../models/UserBarnRole');
const { authenticate, loadBarnContext, requireBarn, hasPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadImage, uploadToCloud } = require('../middleware/upload');

const router = express.Router();

// Apply auth to all routes
router.use(authenticate);
router.use(loadBarnContext);

// Get all users in barn
router.get('/', requireBarn, async (req, res, next) => {
  try {
    const { role, search } = req.query;

    const barnRoles = await UserBarnRole.find({
      barnId: req.barnId,
      status: 'active',
      ...(role && { role })
    }).populate('userId');

    let users = barnRoles
      .filter(r => r.userId)
      .map(r => ({
        id: r.userId._id,
        name: r.userId.name,
        email: r.userId.email,
        avatarUrl: r.userId.avatarUrl,
        role: r.role,
        permissions: r.permissions,
        title: r.title,
        joinedAt: r.joinedAt
      }));

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }

    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's barn roles
    const barnRoles = await UserBarnRole.find({
      userId: user._id,
      status: 'active'
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      accountType: user.accountType,
      permissions: user.permissions,
      barnRoles: barnRoles.map(r => ({
        barnId: r.barnId,
        barnName: r.barnName,
        role: r.role,
        permissions: r.permissions,
        isPrimary: r.isPrimary
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/:id', [
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty(),
  body('phoneNumber').optional(),
  validate
], async (req, res, next) => {
  try {
    // Users can only update themselves (or admins can update anyone)
    if (req.params.id !== req.userId.toString() && req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'Cannot update other users' });
    }

    const { name, phoneNumber, finishedRegistration } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(finishedRegistration !== undefined && { finishedRegistration })
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      accountType: user.accountType,
      finishedRegistration: user.finishedRegistration
    });
  } catch (error) {
    next(error);
  }
});

// Upload avatar
router.post('/:id/avatar', [
  uploadImage.single('avatar'),
  uploadToCloud('avatars')
], async (req, res, next) => {
  try {
    if (req.params.id !== req.userId.toString() && req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'Cannot update other users' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Use cloud URL if available, otherwise fallback to local path
    const avatarUrl = req.file.cloudUrl || `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatarUrl },
      { new: true }
    );

    res.json({ avatarUrl: user.avatarUrl });
  } catch (error) {
    next(error);
  }
});

// Update user permissions (barn context)
router.put('/:id/permissions', [
  requireBarn,
  hasPermission('userManagement'),
  param('id').isMongoId(),
  body('role').optional().isIn(['owner', 'admin', 'manager', 'groomer', 'boarder', 'trainer', 'vendor']),
  body('permissions').optional().isArray(),
  validate
], async (req, res, next) => {
  try {
    const { role, permissions, title } = req.body;

    const barnRole = await UserBarnRole.findOneAndUpdate(
      { userId: req.params.id, barnId: req.barnId },
      {
        ...(role && { role }),
        ...(permissions && { permissions }),
        ...(title !== undefined && { title })
      },
      { new: true }
    );

    if (!barnRole) {
      return res.status(404).json({ error: 'User not in this barn' });
    }

    res.json(barnRole);
  } catch (error) {
    next(error);
  }
});

// Remove user from barn
router.delete('/:id', [
  requireBarn,
  hasPermission('userManagement'),
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    // Cannot remove yourself
    if (req.params.id === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    // Cannot remove owners
    const barnRole = await UserBarnRole.findOne({
      userId: req.params.id,
      barnId: req.barnId
    });

    if (!barnRole) {
      return res.status(404).json({ error: 'User not in this barn' });
    }

    if (barnRole.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove barn owner' });
    }

    // Soft delete the role
    barnRole.status = 'inactive';
    await barnRole.save();

    res.json({ message: 'User removed from barn' });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validate
], async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
