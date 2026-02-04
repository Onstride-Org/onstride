const express = require('express');
const crypto = require('crypto');
const DemoRequest = require('../models/DemoRequest');
const DemoAvailability = require('../models/DemoAvailability');
const User = require('../models/User');
const Barn = require('../models/Barn');
const UserBarnRole = require('../models/UserBarnRole');
const { BarnSubscription } = require('../models/Subscription');
const { sendSignupVerificationEmail, sendDemoAdminNotification } = require('../services/email');

const router = express.Router();

// Public endpoint - get available slots for demo booking (kept for backward compatibility)
router.get('/availability', async (req, res, next) => {
  try {
    let availability = await DemoAvailability.find({ isEnabled: true }).sort({ dayOfWeek: 1 });

    // If no availability settings exist, return defaults
    if (availability.length === 0) {
      const defaultTimeSlots = [
        { time: '9:00 AM', isAvailable: true },
        { time: '10:00 AM', isAvailable: true },
        { time: '11:00 AM', isAvailable: true },
        { time: '1:00 PM', isAvailable: true },
        { time: '2:00 PM', isAvailable: true },
        { time: '3:00 PM', isAvailable: true },
        { time: '4:00 PM', isAvailable: true }
      ];

      // Return Monday-Friday defaults
      availability = [
        { dayOfWeek: 1, isEnabled: true, timeSlots: defaultTimeSlots },
        { dayOfWeek: 2, isEnabled: true, timeSlots: defaultTimeSlots },
        { dayOfWeek: 3, isEnabled: true, timeSlots: defaultTimeSlots },
        { dayOfWeek: 4, isEnabled: true, timeSlots: defaultTimeSlots },
        { dayOfWeek: 5, isEnabled: true, timeSlots: defaultTimeSlots }
      ];
    }

    // Return only enabled days with available time slots
    const result = availability.map(day => ({
      dayOfWeek: day.dayOfWeek,
      timeSlots: day.timeSlots.filter(slot => slot.isAvailable).map(slot => slot.time)
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Public endpoint - signup form submission (no scheduling, sends email verification)
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      barnName,
      discipline,
      horseCount,
      isDecisionMaker
    } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email already exists as a user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }

    // Check if there's already a pending signup request for this email
    const existingRequest = await DemoRequest.findOne({
      email: email.toLowerCase(),
      status: { $in: ['new', 'email_sent'] }
    });

    if (existingRequest) {
      // Resend verification email
      const token = existingRequest.generateVerificationToken();
      await existingRequest.save();

      try {
        await sendSignupVerificationEmail({
          to: email,
          name,
          token,
          barnName: existingRequest.barnName
        });
      } catch (emailError) {
        console.error('Failed to resend signup verification email:', emailError.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Verification email resent. Please check your inbox.',
        resent: true
      });
    }

    // Create new signup request
    const signupRequest = new DemoRequest({
      name,
      email: email.toLowerCase(),
      phone,
      barnName,
      discipline,
      horseCount,
      isDecisionMaker,
      status: 'email_sent'
    });

    // Generate verification token
    const token = signupRequest.generateVerificationToken();
    await signupRequest.save();

    // Send verification email to user
    try {
      await sendSignupVerificationEmail({
        to: email,
        name,
        token,
        barnName
      });
      console.log('Signup verification email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send signup verification email:', emailError.message);
    }

    // Send notification email to admin
    try {
      await sendDemoAdminNotification({
        name,
        email,
        phone,
        barnName,
        discipline,
        horseCount,
        selectedDate: 'N/A (Signup Flow)',
        selectedTime: 'N/A'
      });
      console.log('Admin notification sent for signup');
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Please check your email to complete your account setup.',
      id: signupRequest._id
    });
  } catch (error) {
    next(error);
  }
});

// Verify email token and return signup request data
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const signupRequest = await DemoRequest.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!signupRequest) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Return signup request data (for password setup page)
    res.json({
      success: true,
      data: {
        id: signupRequest._id,
        name: signupRequest.name,
        email: signupRequest.email,
        barnName: signupRequest.barnName,
        discipline: signupRequest.discipline,
        horseCount: signupRequest.horseCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// Complete account setup (set password, create user & barn)
router.post('/complete-signup', async (req, res, next) => {
  try {
    const { token, password, phoneNumber } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const signupRequest = await DemoRequest.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!signupRequest) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: signupRequest.email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Create user
    const user = await User.create({
      email: signupRequest.email,
      password,
      name: signupRequest.name,
      phoneNumber: phoneNumber || signupRequest.phone || '',
      accountType: 'owner',
      emailVerified: true,
      registrationMethod: 'signup_form'
    });

    // Create barn
    const barn = await Barn.create({
      name: signupRequest.barnName || `${signupRequest.name}'s Barn`,
      ownerId: user._id,
      discipline: signupRequest.discipline,
      settings: {
        horseCount: signupRequest.horseCount
      }
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

    // Update signup request status
    signupRequest.status = 'account_created';
    signupRequest.emailVerified = true;
    signupRequest.emailVerifiedAt = new Date();
    signupRequest.userId = user._id;
    signupRequest.emailVerificationToken = undefined;
    signupRequest.emailVerificationExpires = undefined;
    await signupRequest.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please sign in.',
      email: user.email
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
