const express = require('express');
const { body, param } = require('express-validator');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Barn = require('../models/Barn');
const UserBarnRole = require('../models/UserBarnRole');
const { authenticate, loadBarnContext, requireBarn, hasPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const emailService = require('../services/email');

const router = express.Router();

// Get invitation by token (public route for validating invitations)
router.get('/validate/:token', async (req, res, next) => {
  try {
    const invitation = await Invitation.findOne({
      token: req.params.token,
      active: true
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or expired' });
    }

    if (!invitation.isValid()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    res.json({
      id: invitation._id,
      barnName: invitation.barnName,
      accountType: invitation.accountType,
      permissions: invitation.permissions,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      isBulkInvite: invitation.isBulkInvite || false
    });
  } catch (error) {
    next(error);
  }
});

// Accept invitation (public route - for new users)
router.post('/accept/:token', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phoneNumber').optional().trim(),
  validate
], async (req, res, next) => {
  try {
    const invitation = await Invitation.findOne({
      token: req.params.token,
      active: true
    });

    if (!invitation || !invitation.isValid()) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    // For bulk invites, check if max uses reached
    if (invitation.isBulkInvite && invitation.maxUses !== null && invitation.useCount >= invitation.maxUses) {
      return res.status(400).json({ error: 'This invitation link has reached its maximum uses' });
    }

    const { email, name, password, phoneNumber } = req.body;
    // For individual invites, use invitation email. For bulk, use provided email
    const userEmail = invitation.isBulkInvite ? email : (email || invitation.email);

    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    let user = await User.findOne({ email: userEmail });

    if (user) {
      // Existing user - just add to barn
      const existingRole = await UserBarnRole.findOne({
        userId: user._id,
        barnId: invitation.barnId
      });

      if (existingRole) {
        return res.status(400).json({ error: 'User already in this barn' });
      }
    } else {
      // Create new user
      const userData = {
        email: userEmail,
        password,
        name,
        accountType: invitation.accountType,
        permissions: invitation.permissions,
        barnId: invitation.barnId,
        registrationMethod: 'invitation',
        emailVerified: true,
        finishedRegistration: true
      };
      if (phoneNumber) {
        userData.phoneNumber = phoneNumber;
      }
      user = await User.create(userData);
    }

    // Check if user already has a primary barn
    const hasPrimary = await UserBarnRole.findOne({
      userId: user._id,
      isPrimary: true,
      status: 'active'
    });

    // Create barn role
    await UserBarnRole.create({
      userId: user._id,
      barnId: invitation.barnId,
      role: invitation.accountType,
      permissions: invitation.permissions,
      isPrimary: !hasPrimary,
      barnName: invitation.barnName,
      userName: user.name,
      invitedBy: invitation.createdById
    });

    // For bulk invites, increment use count instead of deactivating
    if (invitation.isBulkInvite) {
      invitation.useCount += 1;
      // If max uses is set and reached, deactivate
      if (invitation.maxUses !== null && invitation.useCount >= invitation.maxUses) {
        invitation.active = false;
      }
    } else {
      // For individual invites, mark as used
      invitation.active = false;
    }
    invitation.acceptedAt = new Date();
    invitation.acceptedById = user._id;
    await invitation.save();

    // Generate tokens
    const jwt = require('jsonwebtoken');
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        barnId: user.barnId
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

// Apply auth middleware for remaining routes
router.use(authenticate);
router.use(loadBarnContext);

// Accept invitation as authenticated user (add to existing account)
router.post('/accept-authenticated/:token', async (req, res, next) => {
  try {
    const invitation = await Invitation.findOne({
      token: req.params.token,
      active: true
    });

    if (!invitation || !invitation.isValid()) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    // For bulk invites, check if max uses reached
    if (invitation.isBulkInvite && invitation.maxUses !== null && invitation.useCount >= invitation.maxUses) {
      return res.status(400).json({ error: 'This invitation link has reached its maximum uses' });
    }

    // Get the authenticated user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already in this barn
    const existingRole = await UserBarnRole.findOne({
      userId: user._id,
      barnId: invitation.barnId
    });

    if (existingRole) {
      return res.status(400).json({ error: 'You are already a member of this barn' });
    }

    // Check if user already has a primary barn
    const hasPrimary = await UserBarnRole.findOne({
      userId: user._id,
      isPrimary: true,
      status: 'active'
    });

    // Create barn role
    await UserBarnRole.create({
      userId: user._id,
      barnId: invitation.barnId,
      role: invitation.accountType,
      permissions: invitation.permissions,
      isPrimary: !hasPrimary,
      barnName: invitation.barnName,
      userName: user.name,
      invitedBy: invitation.createdById
    });

    // Update invitation
    if (invitation.isBulkInvite) {
      invitation.useCount += 1;
      if (invitation.maxUses !== null && invitation.useCount >= invitation.maxUses) {
        invitation.active = false;
      }
    } else {
      invitation.active = false;
    }
    invitation.acceptedAt = new Date();
    invitation.acceptedById = user._id;
    await invitation.save();

    res.json({
      success: true,
      message: `You have joined ${invitation.barnName}`,
      barnId: invitation.barnId,
      barnName: invitation.barnName,
      role: invitation.accountType
    });
  } catch (error) {
    next(error);
  }
});

// Get all invitations for barn
router.get('/', [
  requireBarn,
  hasPermission('userManagement')
], async (req, res, next) => {
  try {
    const { active } = req.query;

    const filter = {
      barnId: req.barnId,
      ...(active !== undefined && { active: active === 'true' })
    };

    const invitations = await Invitation.find(filter)
      .populate('createdById', 'name')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    next(error);
  }
});

// Create invitation
router.post('/', [
  requireBarn,
  hasPermission('userManagement'),
  body('accountType').isIn(['owner', 'manager', 'boarder', 'groomer', 'admin', 'trainer', 'vendor']),
  validate
], async (req, res, next) => {
  try {
    const { email, accountType, permissions, expiresInDays } = req.body;

    // Check if an active invitation already exists for this email in this barn
    if (email) {
      const existingInvitation = await Invitation.findOne({
        barnId: req.barnId,
        email: email.toLowerCase(),
        active: true
      });

      if (existingInvitation) {
        return res.status(400).json({
          error: 'An active invitation already exists for this email. You can resend it from the pending invitations list.'
        });
      }
    }

    // Get barn name
    const barn = await Barn.findById(req.barnId);

    // Get inviter's name
    const inviter = await User.findById(req.userId);

    const invitation = await Invitation.create({
      barnId: req.barnId,
      barnName: barn.name,
      email,
      accountType,
      permissions: permissions || [],
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: req.userId
    });

    // Send invitation email
    let emailSent = false;
    if (email) {
      try {
        await emailService.sendInvitationEmail({
          to: email,
          barnName: barn.name,
          inviterName: inviter?.name || 'A barn administrator',
          role: accountType,
          token: invitation.token
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError.message);
        // Don't fail the request if email fails - invitation is still created
      }
    }

    res.status(201).json({
      ...invitation.toObject(),
      inviteUrl: `/invite/${invitation.token}`,
      emailSent
    });
  } catch (error) {
    next(error);
  }
});

// Create bulk/shareable invitation link (24hr expiry by default)
router.post('/bulk', [
  requireBarn,
  hasPermission('userManagement'),
  body('accountType').isIn(['owner', 'manager', 'boarder', 'groomer', 'admin', 'trainer', 'vendor']),
  validate
], async (req, res, next) => {
  try {
    const { accountType, permissions, expiresInHours = 24, maxUses } = req.body;

    // Get barn name
    const barn = await Barn.findById(req.barnId);

    const invitation = await Invitation.create({
      barnId: req.barnId,
      barnName: barn.name,
      accountType,
      permissions: permissions || [],
      isBulkInvite: true,
      maxUses: maxUses || null,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
      createdById: req.userId
    });

    const inviteUrl = `${process.env.CLIENT_URL || ''}/invite/${invitation.token}`;

    res.status(201).json({
      ...invitation.toObject(),
      inviteUrl
    });
  } catch (error) {
    next(error);
  }
});

// Resend invitation
router.post('/:id/resend', [
  hasPermission('userManagement')
], async (req, res, next) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Reset expiration
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    invitation.active = true;
    await invitation.save();

    // Resend email if this is an individual invite with email
    let emailSent = false;
    if (invitation.email && !invitation.isBulkInvite) {
      try {
        const inviter = await User.findById(req.userId);
        await emailService.sendInvitationEmail({
          to: invitation.email,
          barnName: invitation.barnName,
          inviterName: inviter?.name || 'A barn administrator',
          role: invitation.accountType,
          token: invitation.token
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to resend invitation email:', emailError.message);
      }
    }

    res.json({
      ...invitation.toObject(),
      emailSent
    });
  } catch (error) {
    next(error);
  }
});

// Delete invitation
router.delete('/:id', [
  hasPermission('userManagement')
], async (req, res, next) => {
  try {
    const invitation = await Invitation.findOneAndDelete({
      _id: req.params.id,
      barnId: req.barnId
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    res.json({ message: 'Invitation deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
