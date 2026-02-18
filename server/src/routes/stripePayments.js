/**
 * Stripe Payments Routes
 *
 * Handles:
 * - Saved payment methods (customers)
 * - Subscription management
 * - Dispute handling
 * - Payout tracking
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const User = require('../models/User');
const Barn = require('../models/Barn');
const MerchantApplication = require('../models/MerchantApplication');
const { BarnSubscription, SubscriptionPlan } = require('../models/Subscription');
const { authenticate, loadBarnContext, requireBarn, hasPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const stripe = require('../services/stripe');

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(loadBarnContext);

// ============================================
// PUBLISHABLE KEY
// ============================================

/**
 * GET /api/stripe/config
 * Get Stripe publishable key for frontend
 */
router.get('/config', async (req, res) => {
  const configured = await stripe.isConfigured();
  if (!configured) {
    return res.status(503).json({ error: 'Payment processing is not configured' });
  }

  const publishableKey = await stripe.getPublishableKey();
  res.json({ publishableKey });
});

// ============================================
// SAVED PAYMENT METHODS
// ============================================

/**
 * POST /api/stripe/customers
 * Create or retrieve a Stripe customer for the current user
 */
router.post('/customers', async (req, res, next) => {
  try {
    if (!stripe.isConfiguredSync()) {
      return res.status(503).json({ error: 'Payment processing is not configured' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customer = await stripe.createOrRetrieveCustomer({
      email: user.email,
      name: user.name,
      userId: user._id.toString(),
      barnId: req.barnId?.toString(),
    });

    // Store customer ID on user if new
    if (customer.isNew || !user.stripeCustomerId) {
      user.stripeCustomerId = customer.customerId;
      await user.save();
    }

    res.json(customer);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stripe/payment-methods
 * List saved payment methods for the current user
 */
router.get('/payment-methods', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.stripeCustomerId) {
      return res.json({ paymentMethods: [] });
    }

    const paymentMethods = await stripe.listPaymentMethods(user.stripeCustomerId);
    res.json({ paymentMethods });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stripe/setup-intent
 * Create a SetupIntent for saving a new payment method
 */
router.post('/setup-intent', async (req, res, next) => {
  try {
    if (!stripe.isConfiguredSync()) {
      return res.status(503).json({ error: 'Payment processing is not configured' });
    }

    const user = await User.findById(req.userId);

    // Create customer if doesn't exist
    if (!user.stripeCustomerId) {
      const customer = await stripe.createOrRetrieveCustomer({
        email: user.email,
        name: user.name,
        userId: user._id.toString(),
        barnId: req.barnId?.toString(),
      });
      user.stripeCustomerId = customer.customerId;
      await user.save();
    }

    const setupIntent = await stripe.createSetupIntent(user.stripeCustomerId);
    res.json(setupIntent);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stripe/payment-methods/:id/attach
 * Attach a payment method to the current user
 */
router.post('/payment-methods/:id/attach', [
  param('id').isString().notEmpty(),
  body('setDefault').optional().isBoolean(),
  validate
], async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No customer record found' });
    }

    const result = await stripe.attachPaymentMethod(
      user.stripeCustomerId,
      req.params.id,
      req.body.setDefault !== false
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/stripe/payment-methods/:id
 * Remove a saved payment method
 */
router.delete('/payment-methods/:id', [
  param('id').isString().notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const result = await stripe.detachPaymentMethod(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// SUBSCRIPTIONS
// ============================================

/**
 * GET /api/stripe/subscriptions/plans
 * Get available subscription plans
 */
router.get('/subscriptions/plans', async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ sortOrder: 1 });

    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stripe/subscriptions/current
 * Get current barn subscription
 */
router.get('/subscriptions/current', requireBarn, async (req, res, next) => {
  try {
    let subscription = await BarnSubscription.findOne({ barnId: req.barnId });

    if (!subscription) {
      // Create default free subscription
      subscription = await BarnSubscription.create({
        barnId: req.barnId,
        tier: 'free',
        status: 'active',
      });
    }

    // Get plan details
    const plan = await SubscriptionPlan.findOne({ tier: subscription.tier });

    res.json({
      subscription,
      plan,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stripe/subscriptions
 * Create a new subscription for the barn
 */
router.post('/subscriptions', [
  requireBarn,
  hasPermission('manageSettings'),
  body('priceId').isString().notEmpty(),
  body('paymentMethodId').optional().isString(),
  validate
], async (req, res, next) => {
  try {
    if (!stripe.isConfiguredSync()) {
      return res.status(503).json({ error: 'Payment processing is not configured' });
    }

    const user = await User.findById(req.userId);

    // Ensure user has a Stripe customer
    if (!user.stripeCustomerId) {
      const customer = await stripe.createOrRetrieveCustomer({
        email: user.email,
        name: user.name,
        userId: user._id.toString(),
        barnId: req.barnId.toString(),
      });
      user.stripeCustomerId = customer.customerId;
      await user.save();
    }

    // Get barn's connected account (if any)
    const merchantApp = await MerchantApplication.findOne({ barnId: req.barnId });
    const connectedAccountId = merchantApp?.stripeConnect?.accountId;

    // Create subscription
    const subscription = await stripe.createSubscription({
      customerId: user.stripeCustomerId,
      priceId: req.body.priceId,
      paymentMethodId: req.body.paymentMethodId,
      connectedAccountId,
      metadata: {
        barnId: req.barnId.toString(),
        userId: req.userId.toString(),
      },
    });

    res.json(subscription);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/stripe/subscriptions/:id
 * Update subscription (change plan, payment method)
 */
router.put('/subscriptions/:id', [
  requireBarn,
  hasPermission('manageSettings'),
  param('id').isString().notEmpty(),
  body('priceId').optional().isString(),
  body('paymentMethodId').optional().isString(),
  validate
], async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.priceId) updates.priceId = req.body.priceId;
    if (req.body.paymentMethodId) updates.paymentMethodId = req.body.paymentMethodId;

    const subscription = await stripe.updateSubscription(req.params.id, updates);
    res.json(subscription);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stripe/subscriptions/:id/cancel
 * Cancel a subscription
 */
router.post('/subscriptions/:id/cancel', [
  requireBarn,
  hasPermission('manageSettings'),
  param('id').isString().notEmpty(),
  body('immediately').optional().isBoolean(),
  validate
], async (req, res, next) => {
  try {
    const subscription = await stripe.cancelSubscription(
      req.params.id,
      req.body.immediately === true
    );

    // Update local subscription record
    const barnSubscription = await BarnSubscription.findOne({
      stripeSubscriptionId: req.params.id,
    });

    if (barnSubscription) {
      barnSubscription.cancelAtPeriodEnd = subscription.cancelAtPeriodEnd;
      if (subscription.cancelAtPeriodEnd === false) {
        barnSubscription.status = 'canceled';
        barnSubscription.canceledAt = new Date();
      }
      await barnSubscription.save();
    }

    res.json(subscription);
  } catch (error) {
    next(error);
  }
});

// ============================================
// DISPUTES (for barn owners)
// ============================================

/**
 * GET /api/stripe/disputes
 * List disputes for the barn's connected account
 */
router.get('/disputes', [
  requireBarn,
  hasPermission('manageSettings'),
], async (req, res, next) => {
  try {
    const merchantApp = await MerchantApplication.findOne({ barnId: req.barnId });

    if (!merchantApp?.stripeConnect?.accountId) {
      return res.json({ disputes: [], hasMore: false });
    }

    const result = await stripe.listDisputes({
      connectedAccountId: merchantApp.stripeConnect.accountId,
      limit: parseInt(req.query.limit) || 10,
      startingAfter: req.query.startingAfter,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stripe/disputes/:id
 * Get dispute details
 */
router.get('/disputes/:id', [
  requireBarn,
  hasPermission('manageSettings'),
  param('id').isString().notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const dispute = await stripe.retrieveDispute(req.params.id);
    res.json(dispute);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stripe/disputes/:id/evidence
 * Submit evidence for a dispute
 */
router.post('/disputes/:id/evidence', [
  requireBarn,
  hasPermission('manageSettings'),
  param('id').isString().notEmpty(),
  body('customerName').optional().isString(),
  body('customerEmail').optional().isEmail(),
  body('productDescription').optional().isString(),
  body('additionalDetails').optional().isString(),
  validate
], async (req, res, next) => {
  try {
    const result = await stripe.submitDisputeEvidence(req.params.id, {
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      productDescription: req.body.productDescription,
      additionalDetails: req.body.additionalDetails,
      submit: req.body.submit !== false,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// PAYOUTS (for barn owners)
// ============================================

/**
 * GET /api/stripe/payouts
 * List payouts for the barn's connected account
 */
router.get('/payouts', [
  requireBarn,
  hasPermission('manageSettings'),
], async (req, res, next) => {
  try {
    const merchantApp = await MerchantApplication.findOne({ barnId: req.barnId });

    if (!merchantApp?.stripeConnect?.accountId) {
      return res.json({ payouts: [], hasMore: false });
    }

    const result = await stripe.listPayouts(merchantApp.stripeConnect.accountId, {
      limit: parseInt(req.query.limit) || 10,
      startingAfter: req.query.startingAfter,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stripe/payouts/:id
 * Get payout details
 */
router.get('/payouts/:id', [
  requireBarn,
  hasPermission('manageSettings'),
  param('id').isString().notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const merchantApp = await MerchantApplication.findOne({ barnId: req.barnId });

    if (!merchantApp?.stripeConnect?.accountId) {
      return res.status(404).json({ error: 'No connected account found' });
    }

    const payout = await stripe.retrievePayout(
      req.params.id,
      merchantApp.stripeConnect.accountId
    );

    res.json(payout);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stripe/balance
 * Get balance for the barn's connected account
 */
router.get('/balance', [
  requireBarn,
  hasPermission('manageSettings'),
], async (req, res, next) => {
  try {
    const merchantApp = await MerchantApplication.findOne({ barnId: req.barnId });

    if (!merchantApp?.stripeConnect?.accountId) {
      return res.json({
        available: [{ amount: 0, currency: 'usd' }],
        pending: [{ amount: 0, currency: 'usd' }],
      });
    }

    const balance = await stripe.getBalance(merchantApp.stripeConnect.accountId);
    res.json(balance);
  } catch (error) {
    next(error);
  }
});

// ============================================
// USER PAYMENT PROFILE
// ============================================

/**
 * GET /api/stripe/user/payment-profile
 * Get the current user's Stripe payment profile
 * Returns customer ID, saved payment methods, and connection status
 */
router.get('/user/payment-profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = {
      hasStripeCustomer: !!user.stripeCustomerId,
      stripeCustomerId: user.stripeCustomerId || null,
      paymentMethods: [],
      defaultPaymentMethod: null,
    };

    if (user.stripeCustomerId && stripe.isConfiguredSync()) {
      try {
        const methods = await stripe.listPaymentMethods(user.stripeCustomerId);
        profile.paymentMethods = methods;
        profile.defaultPaymentMethod = methods.find(m => m.isDefault) || null;
      } catch (err) {
        console.error('Error fetching payment methods:', err.message);
      }
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stripe/user/ensure-customer
 * Ensure the current user has a Stripe customer record
 * Creates one if it doesn't exist
 */
router.post('/user/ensure-customer', async (req, res, next) => {
  try {
    if (!stripe.isConfiguredSync()) {
      return res.status(503).json({ error: 'Payment processing is not configured' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.stripeCustomerId) {
      return res.json({
        customerId: user.stripeCustomerId,
        isNew: false,
      });
    }

    const customer = await stripe.createOrRetrieveCustomer({
      email: user.email,
      name: user.name,
      userId: user._id.toString(),
      barnId: req.barnId?.toString(),
    });

    user.stripeCustomerId = customer.customerId;
    await user.save();

    res.json({
      customerId: customer.customerId,
      isNew: customer.isNew,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stripe/user/invoices
 * Get invoice payment history for the current user with Stripe details
 */
router.get('/user/invoices', requireBarn, async (req, res, next) => {
  try {
    const Invoice = require('../models/Invoice');

    const invoices = await Invoice.find({
      barnId: req.barnId,
      boarderId: req.userId,
      'stripePaymentInfo.paymentIntentId': { $exists: true },
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('status paidAt method charges paymentBreakdown stripePaymentInfo createdAt dueDate');

    res.json({ invoices });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
