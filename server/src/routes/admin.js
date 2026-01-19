const express = require('express');
const User = require('../models/User');
const Barn = require('../models/Barn');
const Horse = require('../models/Horse');
const UserBarnRole = require('../models/UserBarnRole');
const { BarnSubscription } = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const { authenticate, hasRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
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
      BarnSubscription.findOne({ barnId: barn._id })
        .populate('planId'),
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
      .populate('barnId', 'name')
      .populate('planId');

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
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        deletedAt: new Date(),
        deletedBy: req.userId
      },
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

module.exports = router;
