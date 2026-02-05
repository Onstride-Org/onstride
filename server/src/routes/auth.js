const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Barn = require('../models/Barn');
const UserBarnRole = require('../models/UserBarnRole');
const { BarnSubscription } = require('../models/Subscription');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const twilio = require('../services/twilio');
const emailService = require('../services/email');

const router = express.Router();

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty(),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  validate
], async (req, res, next) => {
  try {
    const { email, password, name, phoneNumber, barnName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      phoneNumber,
      accountType: 'owner',
      registrationMethod: 'email'
    });

    // Create default barn for owner with provided name or default
    const barn = await Barn.create({
      name: barnName || `${name}'s Barn`,
      ownerId: user._id
    });

    // Update user with barn
    user.barnId = barn._id;
    await user.save();

    // Create user-barn role
    await UserBarnRole.create({
      userId: user._id,
      barnId: barn._id,
      role: 'owner',
      isPrimary: true,
      barnName: barn.name,
      userName: user.name
    });

    // Create free subscription for barn
    await BarnSubscription.create({
      barnId: barn._id,
      tier: 'free',
      status: 'active'
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email (non-blocking)
    emailService.sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken
    }).catch(err => {
      console.error('Failed to send verification email:', err.message);
    });

    // Return success without tokens - user must verify email first
    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      email: user.email,
      requiresVerification: true
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  body('password').notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Hardcoded admin credentials - check this FIRST before anything else
    const ADMIN_EMAIL = 'admin@onstrideapp.com';
    const ADMIN_PASSWORD = '3yh73';

    console.log('Login attempt:', { email, password: password === ADMIN_PASSWORD ? 'MATCHES' : 'NO MATCH' });

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Find or create admin user
      let adminUser = await User.findOne({ email: ADMIN_EMAIL });
      if (!adminUser) {
        adminUser = new User({
          email: ADMIN_EMAIL,
          name: 'Admin',
          phoneNumber: '+10000000000',
          accountType: 'admin',
          emailVerified: true
        });
        // Set password directly and save
        adminUser.password = ADMIN_PASSWORD;
        await adminUser.save();
      } else {
        // Ensure admin user has correct accountType
        if (adminUser.accountType !== 'admin') {
          adminUser.accountType = 'admin';
          adminUser.emailVerified = true;
          await adminUser.save();
        }
      }

      const { accessToken, refreshToken } = generateTokens(adminUser._id);
      adminUser.refreshToken = refreshToken;
      await adminUser.save();

      return res.json({
        accessToken,
        refreshToken,
        user: {
          id: adminUser._id,
          email: adminUser.email,
          name: adminUser.name,
          accountType: adminUser.accountType,
          emailVerified: true
        }
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      // Generate new verification token if expired or missing
      if (!user.emailVerificationToken || !user.emailVerificationExpires || user.emailVerificationExpires < Date.now()) {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // Send verification email (non-blocking)
        emailService.sendEmailVerificationEmail({
          to: user.email,
          name: user.name,
          token: verificationToken
        }).catch(err => {
          console.error('Failed to send verification email:', err.message);
        });
      }

      return res.status(403).json({
        error: 'Email not verified. Please check your email for a verification link.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled && user.phoneNumber) {
      // Send verification code
      try {
        const formattedPhone = twilio.formatPhoneNumber(user.phoneNumber);
        await twilio.sendVerificationCode(formattedPhone, user.twoFactorMethod || 'sms');

        // Return partial response indicating 2FA is required
        return res.json({
          requiresTwoFactor: true,
          userId: user._id,
          twoFactorMethod: user.twoFactorMethod || 'sms',
          phoneLastFour: user.phoneNumber.slice(-4),
        });
      } catch (twilioError) {
        console.error('Failed to send 2FA code:', twilioError.message);
        // Fall through to regular login if Twilio fails
      }
    }

    // Generate tokens (no 2FA or 2FA service unavailable)
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update user
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    // Get user's barns
    const barnRoles = await UserBarnRole.find({
      userId: user._id,
      status: 'active'
    }).populate('barnId');

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        accountType: user.accountType,
        permissions: user.permissions,
        barnId: user.barnId,
        finishedRegistration: user.finishedRegistration,
        twoFactorEnabled: user.twoFactorEnabled,
        phoneVerified: user.phoneVerified,
      },
      barns: barnRoles.map(r => ({
        id: r.barnId._id,
        name: r.barnId.name,
        role: r.role,
        isPrimary: r.isPrimary
      })),
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

// Verify 2FA code and complete login
router.post('/verify-2fa', [
  body('userId').isMongoId(),
  body('code').isLength({ min: 4, max: 8 }),
  validate
], async (req, res, next) => {
  try {
    const { userId, code } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid request' });
    }

    if (!user.phoneNumber) {
      return res.status(400).json({ error: 'No phone number on file' });
    }

    // Verify the code with Twilio
    const formattedPhone = twilio.formatPhoneNumber(user.phoneNumber);
    const verification = await twilio.verifyCode(formattedPhone, code);

    if (!verification.valid) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Mark phone as verified if not already
    if (!user.phoneVerified) {
      user.phoneVerified = true;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update user
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    // Get user's barns
    const barnRoles = await UserBarnRole.find({
      userId: user._id,
      status: 'active'
    }).populate('barnId');

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        accountType: user.accountType,
        permissions: user.permissions,
        barnId: user.barnId,
        finishedRegistration: user.finishedRegistration,
        twoFactorEnabled: user.twoFactorEnabled,
        phoneVerified: user.phoneVerified,
      },
      barns: barnRoles.map(r => ({
        id: r.barnId._id,
        name: r.barnId.name,
        role: r.role,
        isPrimary: r.isPrimary
      })),
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

// Resend 2FA code
router.post('/resend-2fa', [
  body('userId').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.phoneNumber) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const formattedPhone = twilio.formatPhoneNumber(user.phoneNumber);
    await twilio.sendVerificationCode(formattedPhone, user.twoFactorMethod || 'sms');

    res.json({
      message: 'Verification code sent',
      phoneLastFour: user.phoneNumber.slice(-4),
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user with matching refresh token
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);

    // Save new refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    next(error);
  }
});

// Logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Clear refresh token
    req.user.refreshToken = null;
    await req.user.save();
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = req.user;

    // Get user's barns
    const barnRoles = await UserBarnRole.find({
      userId: user._id,
      status: 'active'
    }).populate('barnId');

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        accountType: user.accountType,
        permissions: user.permissions,
        barnId: user.barnId,
        emailVerified: user.emailVerified,
        finishedRegistration: user.finishedRegistration
      },
      barns: barnRoles.map(r => ({
        id: r.barnId._id,
        name: r.barnId.name,
        role: r.role,
        isPrimary: r.isPrimary,
        permissions: r.permissions
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  validate
], async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return success even if user not found (security)
      return res.json({ message: 'If email exists, reset link sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    res.json({ message: 'If email exists, reset link sent' });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
  validate
], async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
});

// Verify email
router.post('/verify-email', [
  body('token').notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const { token } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Send welcome email (async, don't wait)
    const primaryRole = await UserBarnRole.findOne({ user: user._id, isPrimary: true })
      .populate('barn', 'name');

    emailService.sendWelcomeEmail({
      to: user.email,
      name: user.name,
      barnName: primaryRole?.barn?.name
    }).catch(err => console.error('Failed to send welcome email:', err));

    // Generate tokens for auto-login
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Get all barn roles
    const barnRoles = await UserBarnRole.find({ user: user._id })
      .populate('barn', 'name')
      .lean();

    res.json({
      message: 'Email verified successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
      },
      barn: primaryRole?.barn ? {
        id: primaryRole.barn._id,
        name: primaryRole.barn.name,
        role: primaryRole.role
      } : null,
      barns: barnRoles.map(br => ({
        id: br.barn._id,
        name: br.barn.name,
        role: br.role,
        isPrimary: br.isPrimary
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Resend verification email
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  validate
], async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, deletedAt: null });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If an account exists, a verification email has been sent' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Rate limit: check if we recently sent an email (within last 2 minutes)
    if (user.emailVerificationExpires) {
      const timeSinceLastSend = (user.emailVerificationExpires - Date.now()) + (24 * 60 * 60 * 1000);
      const twoMinutesAgo = 24 * 60 * 60 * 1000 - (2 * 60 * 1000);
      if (timeSinceLastSend > twoMinutesAgo) {
        return res.status(429).json({ error: 'Please wait 2 minutes before requesting another email' });
      }
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    await emailService.sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken
    });

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
});

// Check verification status (for polling from waiting screen)
router.post('/check-verification', [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  validate
], async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, deletedAt: null });
    if (!user) {
      return res.json({ verified: false });
    }

    if (!user.emailVerified) {
      return res.json({ verified: false });
    }

    // User is verified - generate tokens for auto-login
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    // Get barn roles
    const barnRoles = await UserBarnRole.find({
      userId: user._id,
      status: 'active'
    }).populate('barnId', 'name');

    const barns = barnRoles.map(br => ({
      barnId: br.barnId._id,
      barnName: br.barnId.name,
      role: br.role,
      isPrimary: br.isPrimary
    }));

    res.json({
      verified: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
      },
      barns
    });
  } catch (error) {
    next(error);
  }
});

// ============ 2FA Management ============

// Send verification code to verify phone (before enabling 2FA)
router.post('/2fa/send-code', authenticate, async (req, res, next) => {
  try {
    const user = req.user;

    if (!user.phoneNumber) {
      return res.status(400).json({ error: 'Please add a phone number first' });
    }

    if (!twilio.isConfigured()) {
      return res.status(503).json({ error: '2FA service is not configured' });
    }

    const formattedPhone = twilio.formatPhoneNumber(user.phoneNumber);

    if (!twilio.isValidPhoneNumber(formattedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    await twilio.sendVerificationCode(formattedPhone, 'sms');

    res.json({
      message: 'Verification code sent',
      phoneLastFour: user.phoneNumber.slice(-4),
    });
  } catch (error) {
    next(error);
  }
});

// Verify phone and enable 2FA
router.post('/2fa/enable', [
  authenticate,
  body('code').isLength({ min: 4, max: 8 }),
  validate
], async (req, res, next) => {
  try {
    const user = req.user;
    const { code } = req.body;

    if (!user.phoneNumber) {
      return res.status(400).json({ error: 'Please add a phone number first' });
    }

    const formattedPhone = twilio.formatPhoneNumber(user.phoneNumber);
    const verification = await twilio.verifyCode(formattedPhone, code);

    if (!verification.valid) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Enable 2FA
    user.phoneVerified = true;
    user.twoFactorEnabled = true;
    user.twoFactorMethod = 'sms';
    await user.save();

    res.json({
      message: '2FA enabled successfully',
      twoFactorEnabled: true,
      phoneVerified: true,
    });
  } catch (error) {
    next(error);
  }
});

// Disable 2FA
router.post('/2fa/disable', [
  authenticate,
  body('password').notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const { password } = req.body;

    // Get user with password for verification
    const user = await User.findById(req.userId).select('+password');

    // Verify password before disabling 2FA
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorMethod = null;
    await user.save();

    res.json({
      message: '2FA disabled successfully',
      twoFactorEnabled: false,
    });
  } catch (error) {
    next(error);
  }
});

// Get 2FA status
router.get('/2fa/status', authenticate, async (req, res, next) => {
  try {
    const user = req.user;

    res.json({
      twoFactorEnabled: user.twoFactorEnabled || false,
      twoFactorMethod: user.twoFactorMethod || null,
      phoneVerified: user.phoneVerified || false,
      phoneNumber: user.phoneNumber ? `***${user.phoneNumber.slice(-4)}` : null,
      isConfigured: twilio.isConfigured(),
    });
  } catch (error) {
    next(error);
  }
});

// Delete account
router.delete('/account', [
  authenticate,
  body('password').notEmpty().withMessage('Password is required to delete account'),
  validate
], async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValid = await user.comparePassword(req.body.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Soft delete user
    user.deletedAt = new Date();
    user.refreshToken = null;
    await user.save();

    // Deactivate all barn roles
    await UserBarnRole.updateMany(
      { userId: user._id },
      { status: 'inactive' }
    );

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============ Admin Invite Setup ============

// Verify admin invite token (for setup-account page)
router.get('/verify-setup-token/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() },
      deletedAt: null
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired setup link' });
    }

    res.json({
      data: {
        id: user._id,
        email: user.email,
        name: user.name || '',
        accountType: user.accountType
      }
    });
  } catch (error) {
    next(error);
  }
});

// Complete admin invite setup (set password)
router.post('/complete-setup', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').optional().trim(),
  validate
], async (req, res, next) => {
  try {
    const { token, password, name } = req.body;

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() },
      deletedAt: null
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired setup link' });
    }

    // Update user with password and mark as verified
    user.password = password;
    user.emailVerified = true;
    user.finishedRegistration = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    if (name) {
      user.name = name;
    }
    await user.save();

    res.json({
      success: true,
      message: 'Account setup complete. Please sign in.',
      email: user.email
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
