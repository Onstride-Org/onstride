const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Barn = require('../models/Barn');
const Horse = require('../models/Horse');
const UserBarnRole = require('../models/UserBarnRole');
const { BarnSubscription } = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const DemoRequest = require('../models/DemoRequest');
const DemoAvailability = require('../models/DemoAvailability');
const { authenticate, hasRole } = require('../middleware/auth');

const router = express.Router();

// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@onstrideapp.com';
const ADMIN_PASSWORD = '3yh73';

// Admin login - no auth required
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate admin token
    const token = jwt.sign(
      { email: ADMIN_EMAIL, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        email: ADMIN_EMAIL,
        name: 'Admin'
      }
    });
  } catch (error) {
    next(error);
  }
});

// All other admin routes require authentication and admin role
router.use(authenticate);
router.use(hasRole('admin'));

// Get admin dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalBarns,
      totalHorses,
      activeSubscriptions,
      newUsersThisWeek,
      revenueThisMonth,
      totalTransactionFees,
      totalSubscriptionRevenue
    ] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      Barn.countDocuments({ deletedAt: null }),
      Horse.countDocuments({ deletedAt: null }),
      BarnSubscription.countDocuments({ status: 'active' }),
      User.countDocuments({
        deletedAt: null,
        createdAt: { $gte: oneWeekAgo }
      }),
      Invoice.aggregate([
        {
          $match: {
            status: 'paid',
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$subtotal' }
          }
        }
      ]).then(result => result[0]?.total || 0),
      // Total transaction fees collected (platform fees from invoices)
      Invoice.aggregate([
        {
          $match: {
            status: 'paid',
            'paymentBreakdown.platformFee': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$paymentBreakdown.platformFee' }
          }
        }
      ]).then(result => result[0]?.total || 0),
      // Total subscription revenue (monthly)
      BarnSubscription.aggregate([
        {
          $match: {
            status: 'active'
          }
        },
        {
          $lookup: {
            from: 'subscriptionplans',
            localField: 'planId',
            foreignField: '_id',
            as: 'plan'
          }
        },
        {
          $unwind: { path: '$plan', preserveNullAndEmptyArrays: true }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$plan.price', 0] } }
          }
        }
      ]).then(result => result[0]?.total || 0)
    ]);

    // Calculate averages
    const avgHorsesPerBarn = totalBarns > 0 ? (totalHorses / totalBarns).toFixed(1) : 0;
    const avgUsersPerBarn = totalBarns > 0 ? (totalUsers / totalBarns).toFixed(1) : 0;
    const avgRevenuePerBarn = totalBarns > 0
      ? ((totalTransactionFees + totalSubscriptionRevenue) / totalBarns).toFixed(2)
      : 0;

    res.json({
      totalUsers,
      totalBarns,
      totalHorses,
      activeSubscriptions,
      newUsersThisWeek,
      revenueThisMonth,
      // New average stats
      avgHorsesPerBarn: parseFloat(avgHorsesPerBarn),
      avgUsersPerBarn: parseFloat(avgUsersPerBarn),
      avgRevenuePerBarn: parseFloat(avgRevenuePerBarn),
      totalTransactionFees,
      totalSubscriptionRevenue
    });
  } catch (error) {
    next(error);
  }
});

// Analytics endpoint
router.get('/analytics', async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    let groupByFormat;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupByFormat = '%Y-%m-%d';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupByFormat = '%Y-%m-%d';
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupByFormat = '%Y-%m';
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupByFormat = '%Y-%m-%d';
    }

    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

    // Get current period counts
    const [totalUsers, totalBarns, totalHorses, totalDemoRequests] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      Barn.countDocuments({ deletedAt: null }),
      Horse.countDocuments({ deletedAt: null }),
      DemoRequest.countDocuments()
    ]);

    // Get previous period counts for growth calculation
    const [prevUsers, prevBarns, prevHorses, prevDemos] = await Promise.all([
      User.countDocuments({ deletedAt: null, createdAt: { $lt: startDate } }),
      Barn.countDocuments({ deletedAt: null, createdAt: { $lt: startDate } }),
      Horse.countDocuments({ deletedAt: null, createdAt: { $lt: startDate } }),
      DemoRequest.countDocuments({ createdAt: { $lt: startDate } })
    ]);

    // Calculate growth percentages
    const calcGrowth = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
    };

    // Time series data
    const [userTimeSeries, barnTimeSeries, demoTimeSeries, horseTimeSeries] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate }, deletedAt: null } },
        { $group: { _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Barn.aggregate([
        { $match: { createdAt: { $gte: startDate }, deletedAt: null } },
        { $group: { _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      DemoRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Horse.aggregate([
        { $match: { createdAt: { $gte: startDate }, deletedAt: null } },
        { $group: { _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Merge time series data
    const dateSet = new Set([
      ...userTimeSeries.map(d => d._id),
      ...barnTimeSeries.map(d => d._id),
      ...demoTimeSeries.map(d => d._id),
      ...horseTimeSeries.map(d => d._id)
    ]);

    const timeSeries = Array.from(dateSet).sort().map(date => ({
      date,
      users: userTimeSeries.find(d => d._id === date)?.count || 0,
      barns: barnTimeSeries.find(d => d._id === date)?.count || 0,
      demoRequests: demoTimeSeries.find(d => d._id === date)?.count || 0,
      horses: horseTimeSeries.find(d => d._id === date)?.count || 0
    }));

    // Top barns by horses
    const topBarns = await Barn.aggregate([
      { $match: { deletedAt: null } },
      {
        $lookup: {
          from: 'horses',
          localField: '_id',
          foreignField: 'barnId',
          as: 'horses'
        }
      },
      {
        $lookup: {
          from: 'userbarnroles',
          localField: '_id',
          foreignField: 'barnId',
          as: 'users'
        }
      },
      {
        $lookup: {
          from: 'invoices',
          let: { barnId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$barnId', '$$barnId'] }, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$subtotal' } } }
          ],
          as: 'revenue'
        }
      },
      {
        $project: {
          name: 1,
          horseCount: { $size: { $filter: { input: '$horses', cond: { $eq: ['$$this.deletedAt', null] } } } },
          userCount: { $size: { $filter: { input: '$users', cond: { $eq: ['$$this.status', 'active'] } } } },
          revenue: { $ifNull: [{ $arrayElemAt: ['$revenue.total', 0] }, 0] }
        }
      },
      { $sort: { horseCount: -1 } },
      { $limit: 10 }
    ]);

    // Demo conversion stats
    const [totalDemos, completedDemos] = await Promise.all([
      DemoRequest.countDocuments(),
      DemoRequest.countDocuments({ status: 'completed' })
    ]);

    // Users by type
    const usersByType = await User.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$accountType', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } }
    ]);

    // Demos by status
    const demosByStatus = await DemoRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalBarns,
        totalHorses,
        totalDemoRequests,
        userGrowth: calcGrowth(totalUsers, prevUsers),
        barnGrowth: calcGrowth(totalBarns, prevBarns),
        horseGrowth: calcGrowth(totalHorses, prevHorses),
        demoGrowth: calcGrowth(totalDemoRequests, prevDemos)
      },
      timeSeries,
      topBarns,
      demoConversion: {
        total: totalDemos,
        converted: completedDemos,
        rate: totalDemos > 0 ? (completedDemos / totalDemos) * 100 : 0
      },
      usersByType,
      demosByStatus
    });
  } catch (error) {
    next(error);
  }
});

// Get recent users
router.get('/users/recent', async (req, res, next) => {
  try {
    const users = await User.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email accountType createdAt');

    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get all users (with pagination)
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, accountType } = req.query;

    const filter = { deletedAt: null };
    if (accountType) filter.accountType = accountType;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password -refreshToken');

    const total = await User.countDocuments(filter);

    res.json({
      data: users,
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

// Get recent barns
router.get('/barns/recent', async (req, res, next) => {
  try {
    const barns = await Barn.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('ownerId', 'name email');

    res.json(barns);
  } catch (error) {
    next(error);
  }
});

// Get all barns (with pagination)
router.get('/barns', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const filter = { deletedAt: null };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const barns = await Barn.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('ownerId', 'name email');

    const total = await Barn.countDocuments(filter);

    // Get counts for each barn
    const barnsWithCounts = await Promise.all(barns.map(async (barn) => {
      const [horseCount, userCount] = await Promise.all([
        Horse.countDocuments({ barnId: barn._id, deletedAt: null }),
        UserBarnRole.countDocuments({ barnId: barn._id, status: 'active' })
      ]);
      return {
        ...barn.toObject(),
        horseCount,
        userCount
      };
    }));

    res.json({
      data: barnsWithCounts,
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

// Get single barn detail
router.get('/barns/:id', async (req, res, next) => {
  try {
    const barn = await Barn.findById(req.params.id)
      .populate('ownerId', 'name email phoneNumber');

    if (!barn) {
      return res.status(404).json({ error: 'Barn not found' });
    }

    // Get related data
    const [
      horses,
      users,
      subscription,
      recentInvoices,
      totalRevenue
    ] = await Promise.all([
      Horse.find({ barnId: barn._id, deletedAt: null })
        .select('name breed color status createdAt')
        .sort({ createdAt: -1 })
        .limit(20),
      UserBarnRole.find({ barnId: barn._id, status: 'active' })
        .populate('userId', 'name email phoneNumber accountType')
        .sort({ role: 1, joinedAt: 1 }),
      BarnSubscription.findOne({ barnId: barn._id }),
      Invoice.find({ barnId: barn._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('subtotal status createdAt paidAt'),
      Invoice.aggregate([
        { $match: { barnId: barn._id, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$subtotal' }, platformFees: { $sum: '$paymentBreakdown.platformFee' } } }
      ]).then(result => result[0] || { total: 0, platformFees: 0 })
    ]);

    res.json({
      barn,
      horses,
      users: users.map(u => ({
        ...u.toObject(),
        user: u.userId
      })),
      subscription,
      recentInvoices,
      stats: {
        horseCount: horses.length,
        userCount: users.length,
        totalRevenue: totalRevenue.total,
        platformFeesCollected: totalRevenue.platformFees
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get subscriptions
router.get('/subscriptions', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const subscriptions = await BarnSubscription.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('barnId', 'name');

    const total = await BarnSubscription.countDocuments(filter);

    res.json({
      data: subscriptions,
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

// Get single user detail
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's barn memberships
    const barnRoles = await UserBarnRole.find({ userId: user._id, status: 'active' })
      .populate('barnId', 'name');

    // Get horses owned/associated with this user
    const horses = await Horse.find({
      $or: [
        { boarderId: user._id },
        { ownerId: user._id },
        { createdById: user._id }
      ],
      deletedAt: null
    }).select('name breed color barnId status')
      .populate('barnId', 'name');

    // Get recent invoices for this user
    const invoices = await Invoice.find({ boarderId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('subtotal status createdAt barnId')
      .populate('barnId', 'name');

    // Calculate total spent
    const totalSpent = await Invoice.aggregate([
      { $match: { boarderId: user._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$subtotal' } } }
    ]).then(result => result[0]?.total || 0);

    res.json({
      user,
      barnRoles: barnRoles.map(r => ({
        barn: r.barnId,
        role: r.role,
        status: r.status,
        joinedAt: r.joinedAt,
        isPrimary: r.isPrimary
      })),
      horses,
      recentInvoices: invoices,
      stats: {
        barnCount: barnRoles.length,
        horseCount: horses.length,
        totalSpent
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user (admin can edit any user)
router.put('/users/:id', async (req, res, next) => {
  try {
    const { name, email, accountType, emailVerified } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(accountType && { accountType }),
        ...(emailVerified !== undefined && { emailVerified })
      },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Delete user (soft delete)
router.delete('/users/:id', async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const update = { deletedAt: new Date() };
    // deletedBy only when req.userId is a valid 24-char ObjectId (app admin); standalone admin token uses string 'admin'
    if (req.userId && /^[a-f0-9]{24}$/i.test(req.userId)) {
      update.deletedBy = req.userId;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
});

// Create/invite a new user (admin)
router.post('/users/invite', async (req, res, next) => {
  try {
    const { email, name, accountType, barnId, barnName } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase(), deletedAt: null });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Generate a verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const role = accountType || 'owner';

    // Create user in pending state (no password yet)
    const user = await User.create({
      email: email.toLowerCase(),
      name: name || '',
      accountType: role,
      emailVerified: false,
      finishedRegistration: false,
      verificationToken,
      verificationExpires,
      registrationMethod: 'admin_invite',
      ...(barnId && { barnId })
    });

    let assignedBarnId = barnId;
    let assignedBarnName = '';

    // If this is an owner and no barnId was provided, create a new barn + subscription
    // (mirrors the self-registration flow so owners get the same experience)
    if (role === 'owner' && !barnId) {
      const newBarn = await Barn.create({
        name: barnName || (name ? `${name}'s Barn` : `${email.split('@')[0]}'s Barn`),
        ownerId: user._id
      });

      // Update user with barn
      user.barnId = newBarn._id;
      await user.save();

      // Create free subscription for the barn (user must upgrade after login)
      await BarnSubscription.create({
        barnId: newBarn._id,
        tier: 'free',
        status: 'active'
      });

      assignedBarnId = newBarn._id;
      assignedBarnName = newBarn.name;
    }

    // Create barn role if we have a barnId (either provided or newly created)
    if (assignedBarnId) {
      let barn;
      if (!assignedBarnName) {
        barn = await Barn.findById(assignedBarnId);
        assignedBarnName = barn?.name || '';
      }

      await UserBarnRole.create({
        userId: user._id,
        barnId: assignedBarnId,
        role: role,
        isPrimary: true,
        barnName: assignedBarnName,
        userName: name || email
      });
    }

    // Send setup email
    const emailService = require('../services/email');
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    const setupUrl = `${CLIENT_URL}/setup-account?token=${verificationToken}`;

    try {
      await emailService.sendEmail({
        to: email,
        subject: 'Complete your OnStride account setup',
        text: `
Hello${name ? ` ${name}` : ''},

You've been invited to join OnStride, a modern barn management platform.

Click the link below to set up your password and complete your account:
${setupUrl}

This link will expire in 7 days.

Best regards,
The OnStride Team
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #1a1a1a;">Welcome to OnStride</h1>
    <p style="color: #525252; line-height: 1.6; margin: 0 0 24px 0;">
      ${name ? `Hi ${name},<br><br>` : ''}You've been invited to join OnStride, a modern barn management platform.
    </p>
    <a href="${setupUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
      Set Up Your Account
    </a>
    <p style="color: #737373; font-size: 14px; margin-top: 24px;">
      This link will expire in 7 days.
    </p>
  </div>
</body>
</html>
        `.trim()
      });
    } catch (emailError) {
      console.error('Failed to send setup email:', emailError.message);
      // Don't fail - user is created, they can use forgot password
    }

    res.status(201).json({
      message: 'User created and invitation sent',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        accountType: user.accountType
      },
      barnId: assignedBarnId,
      setupUrl // Include for testing/debug
    });
  } catch (error) {
    next(error);
  }
});

// Update barn
router.put('/barns/:id', async (req, res, next) => {
  try {
    const { name, address, phone, email } = req.body;

    const barn = await Barn.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email })
      },
      { new: true }
    ).populate('ownerId', 'name email');

    if (!barn) {
      return res.status(404).json({ error: 'Barn not found' });
    }

    res.json(barn);
  } catch (error) {
    next(error);
  }
});

// Set barn subscription tier (admin override for testing - no payment required)
const VALID_TIERS = ['free', 'starter', 'business', 'business_pro', 'enterprise', 'founders'];
router.put('/barns/:id/subscription', async (req, res, next) => {
  try {
    const { tier } = req.body;

    if (!tier || !VALID_TIERS.includes(tier)) {
      return res.status(400).json({ error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` });
    }

    const barn = await Barn.findById(req.params.id);
    if (!barn) {
      return res.status(404).json({ error: 'Barn not found' });
    }

    const subscription = await BarnSubscription.findOneAndUpdate(
      { barnId: barn._id },
      {
        tier,
        status: 'active',
        $unset: { stripeSubscriptionId: 1, stripeCustomerId: 1 }
      },
      { new: true, upsert: true }
    );

    res.json(subscription);
  } catch (error) {
    next(error);
  }
});

// Delete barn (soft delete)
router.delete('/barns/:id', async (req, res, next) => {
  try {
    const barn = await Barn.findByIdAndUpdate(
      req.params.id,
      {
        deletedAt: new Date(),
        deletedBy: req.userId
      },
      { new: true }
    );

    if (!barn) {
      return res.status(404).json({ error: 'Barn not found' });
    }

    res.json({ message: 'Barn deleted' });
  } catch (error) {
    next(error);
  }
});

// ==================== Demo Requests ====================

// Get all demo requests (with pagination)
router.get('/demo-requests', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { barnName: { $regex: search, $options: 'i' } }
      ];
    }

    const demoRequests = await DemoRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await DemoRequest.countDocuments(filter);

    res.json({
      data: demoRequests,
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

// Get demo request stats
router.get('/demo-requests/stats', async (req, res, next) => {
  try {
    const [total, newCount, contactedCount, scheduledCount, completedCount] = await Promise.all([
      DemoRequest.countDocuments(),
      DemoRequest.countDocuments({ status: 'new' }),
      DemoRequest.countDocuments({ status: 'contacted' }),
      DemoRequest.countDocuments({ status: 'scheduled' }),
      DemoRequest.countDocuments({ status: 'completed' })
    ]);

    res.json({
      total,
      new: newCount,
      contacted: contactedCount,
      scheduled: scheduledCount,
      completed: completedCount
    });
  } catch (error) {
    next(error);
  }
});

// Get single demo request
router.get('/demo-requests/:id', async (req, res, next) => {
  try {
    const demoRequest = await DemoRequest.findById(req.params.id);

    if (!demoRequest) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    res.json(demoRequest);
  } catch (error) {
    next(error);
  }
});

// Update demo request status/notes
router.put('/demo-requests/:id', async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const demoRequest = await DemoRequest.findByIdAndUpdate(
      req.params.id,
      {
        ...(status && { status }),
        ...(notes !== undefined && { notes })
      },
      { new: true }
    );

    if (!demoRequest) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    res.json(demoRequest);
  } catch (error) {
    next(error);
  }
});

// Delete demo request
router.delete('/demo-requests/:id', async (req, res, next) => {
  try {
    const demoRequest = await DemoRequest.findByIdAndDelete(req.params.id);

    if (!demoRequest) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    res.json({ message: 'Demo request deleted' });
  } catch (error) {
    next(error);
  }
});

// ==================== Demo Availability ====================

// Get all availability settings
router.get('/availability', async (req, res, next) => {
  try {
    let availability = await DemoAvailability.find().sort({ dayOfWeek: 1 });

    // If no availability settings exist, create defaults
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

      // Create entries for Monday-Friday (1-5), weekends disabled
      const days = [
        { dayOfWeek: 0, isEnabled: false, timeSlots: defaultTimeSlots }, // Sunday
        { dayOfWeek: 1, isEnabled: true, timeSlots: defaultTimeSlots },  // Monday
        { dayOfWeek: 2, isEnabled: true, timeSlots: defaultTimeSlots },  // Tuesday
        { dayOfWeek: 3, isEnabled: true, timeSlots: defaultTimeSlots },  // Wednesday
        { dayOfWeek: 4, isEnabled: true, timeSlots: defaultTimeSlots },  // Thursday
        { dayOfWeek: 5, isEnabled: true, timeSlots: defaultTimeSlots },  // Friday
        { dayOfWeek: 6, isEnabled: false, timeSlots: defaultTimeSlots }  // Saturday
      ];

      availability = await DemoAvailability.insertMany(days);
    }

    res.json(availability);
  } catch (error) {
    next(error);
  }
});

// Update availability for a specific day
router.put('/availability/:dayOfWeek', async (req, res, next) => {
  try {
    const { dayOfWeek } = req.params;
    const { isEnabled, timeSlots } = req.body;

    const availability = await DemoAvailability.findOneAndUpdate(
      { dayOfWeek: parseInt(dayOfWeek) },
      {
        ...(isEnabled !== undefined && { isEnabled }),
        ...(timeSlots && { timeSlots })
      },
      { new: true, upsert: true }
    );

    res.json(availability);
  } catch (error) {
    next(error);
  }
});

// Bulk update all availability
router.put('/availability', async (req, res, next) => {
  try {
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ error: 'Availability must be an array' });
    }

    const updates = await Promise.all(
      availability.map(day =>
        DemoAvailability.findOneAndUpdate(
          { dayOfWeek: day.dayOfWeek },
          { isEnabled: day.isEnabled, timeSlots: day.timeSlots },
          { new: true, upsert: true }
        )
      )
    );

    res.json(updates);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
