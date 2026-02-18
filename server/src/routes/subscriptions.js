const express = require('express');
const { body, param } = require('express-validator');
const { SubscriptionPlan, BarnSubscription, UsageMetrics } = require('../models/Subscription');
const { authenticate, loadBarnContext, requireBarn, hasRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Invoice = require('../models/Invoice');
const MerchantApplication = require('../models/MerchantApplication');
const User = require('../models/User');
const Barn = require('../models/Barn');
const stripe = require('../services/stripe');

const router = express.Router();

// Default plans: Stripe as processor. $15 Starter, $99 Business, $299 Business Pro, Enterprise contact, $100 Founders
const DEFAULT_PLANS = [
  { tier: 'free', name: 'Free', description: 'Get started with core features.', monthlyPriceCents: 0, yearlyPriceCents: 0, maxHorses: 5, maxUsers: 3, maxLessonsPerMonth: 10, maxBarns: 1, hasBilling: false, hasFullBilling: false, hasAiFeatures: false, hasMultiBarn: false, hasBranding: false, hasApiAccess: false, hasPrioritySupport: false, isPopular: false, sortOrder: 0 },
  { tier: 'starter', name: 'Starter', description: 'For small barns getting started.', monthlyPriceCents: 1500, yearlyPriceCents: 15000, maxHorses: 10, maxUsers: 5, maxLessonsPerMonth: 50, maxBarns: 1, hasBilling: true, hasFullBilling: false, hasAiFeatures: false, hasMultiBarn: false, hasBranding: false, hasApiAccess: false, hasPrioritySupport: false, isPopular: true, sortOrder: 1 },
  { tier: 'business', name: 'Business', description: 'For growing operations.', monthlyPriceCents: 9900, yearlyPriceCents: 99000, maxHorses: 50, maxUsers: 25, maxLessonsPerMonth: 200, maxBarns: 1, hasBilling: true, hasFullBilling: true, hasAiFeatures: false, hasMultiBarn: false, hasBranding: true, hasApiAccess: false, hasPrioritySupport: true, isPopular: false, sortOrder: 2 },
  { tier: 'business_pro', name: 'Business Pro', description: 'Full platform for professional barns.', monthlyPriceCents: 29900, yearlyPriceCents: 299000, maxHorses: 150, maxUsers: 75, maxLessonsPerMonth: 500, maxBarns: 3, hasBilling: true, hasFullBilling: true, hasAiFeatures: true, hasMultiBarn: true, hasBranding: true, hasApiAccess: true, hasPrioritySupport: true, isPopular: false, sortOrder: 3 },
  { tier: 'founders', name: 'Founders', description: 'Special pricing for early supporters.', monthlyPriceCents: 10000, yearlyPriceCents: 100000, maxHorses: 100, maxUsers: 50, maxLessonsPerMonth: 300, maxBarns: 2, hasBilling: true, hasFullBilling: true, hasAiFeatures: true, hasMultiBarn: true, hasBranding: true, hasApiAccess: true, hasPrioritySupport: true, isPopular: false, sortOrder: 4 },
  { tier: 'enterprise', name: 'Enterprise', description: 'Custom solutions for large organizations.', monthlyPriceCents: 0, yearlyPriceCents: 0, contactEmail: 'admin@onstrideapp.com', maxHorses: -1, maxUsers: -1, maxLessonsPerMonth: -1, maxBarns: -1, hasBilling: true, hasFullBilling: true, hasAiFeatures: true, hasMultiBarn: true, hasBranding: true, hasApiAccess: true, hasPrioritySupport: true, hasDedicatedSupport: true, isPopular: false, sortOrder: 5 },
];

async function ensurePlansExist() {
  for (const plan of DEFAULT_PLANS) {
    await SubscriptionPlan.findOneAndUpdate(
      { tier: plan.tier },
      { $set: plan },
      { upsert: true, new: true }
    );
  }
}

const PLAN_TIERS = ['free', 'starter', 'business', 'business_pro', 'enterprise', 'founders'];

// Get available plans (public); ensures default plans exist (Stripe as processor)
router.get('/plans', async (req, res, next) => {
  try {
    await ensurePlansExist();
    const plans = await SubscriptionPlan.find({
      isActive: true,
      tier: { $in: PLAN_TIERS }
    }).sort({ sortOrder: 1 });

    res.json(plans);
  } catch (error) {
    next(error);
  }
});

router.use(authenticate);
router.use(loadBarnContext);

// Get current subscription
router.get('/', requireBarn, async (req, res, next) => {
  try {
    let subscription = await BarnSubscription.findOne({ barnId: req.barnId });

    if (!subscription) {
      // Create free subscription
      subscription = await BarnSubscription.create({
        barnId: req.barnId,
        tier: 'free',
        status: 'active'
      });
    }

    const plan = await SubscriptionPlan.findOne({ tier: subscription.tier });

    res.json({
      subscription,
      plan
    });
  } catch (error) {
    next(error);
  }
});

// Create subscription invoice for in-app payment (no redirect) - used with PaymentModal
router.post('/checkout-invoice', [
  requireBarn,
  hasRole('owner'),
  body('tier').isIn(['starter', 'business', 'business_pro', 'founders']),
  body('billingInterval').isIn(['monthly', 'yearly']),
  validate
], async (req, res, next) => {
  try {
    const { tier, billingInterval } = req.body;

    const plan = await SubscriptionPlan.findOne({ tier });
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    if (plan.contactEmail) {
      return res.status(400).json({ error: 'Enterprise plan requires contact. Use the Contact us link.' });
    }

    const amountDollars = billingInterval === 'yearly'
      ? (plan.yearlyPriceCents / 100)
      : (plan.monthlyPriceCents / 100);

    if (amountDollars <= 0) {
      return res.status(400).json({ error: 'Plan has no price' });
    }

    const dueDate = new Date();
    const description = `${plan.name} - ${billingInterval === 'yearly' ? 'Yearly' : 'Monthly'}`;
    const charges = [{
      description,
      amount: amountDollars,
      quantity: 1,
      type: 'other'
    }];
    const subtotal = amountDollars;
    const feeBreakdown = stripe.calculateFees(subtotal, 'card');

    const invoice = await Invoice.create({
      barnId: req.barnId,
      boarderId: req.userId,
      createdById: req.userId,
      dueDate,
      charges,
      method: 'card',
      subscriptionTier: tier,
      subscriptionInterval: billingInterval,
      status: 'pending',
      paymentBreakdown: {
        subtotal: feeBreakdown.subtotal,
        processingFee: feeBreakdown.processingFee,
        platformFee: feeBreakdown.platformFee,
        total: feeBreakdown.total
      }
    });

    return res.json({
      invoiceId: invoice._id.toString(),
      amount: feeBreakdown.total,
      description,
      subtotal: feeBreakdown.subtotal,
      processingFee: feeBreakdown.processingFee,
    });
  } catch (error) {
    next(error);
  }
});

// Create checkout session (Stripe) - creates subscription invoice and returns PaymentIntent
router.post('/checkout', [
  requireBarn,
  hasRole('owner'),
  body('tier').isIn(['starter', 'business', 'business_pro', 'founders']),
  body('billingInterval').isIn(['monthly', 'yearly']),
  validate
], async (req, res, next) => {
  try {
    const { tier, billingInterval } = req.body;

    const plan = await SubscriptionPlan.findOne({ tier });
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    if (plan.contactEmail) {
      return res.status(400).json({ error: 'Enterprise plan requires contact. Use the Contact us link.' });
    }

    const amountDollars = billingInterval === 'yearly'
      ? (plan.yearlyPriceCents / 100)
      : (plan.monthlyPriceCents / 100);

    if (amountDollars <= 0) {
      return res.status(400).json({ error: 'Plan has no price' });
    }

    const user = await User.findById(req.userId).select('name email stripeCustomerId');
    const dueDate = new Date();

    const charges = [{
      description: `${plan.name} - ${billingInterval === 'yearly' ? 'Yearly' : 'Monthly'}`,
      amount: amountDollars,
      quantity: 1,
      type: 'other'
    }];
    const subtotal = amountDollars;
    const feeBreakdown = stripe.calculateFees(subtotal, 'card');

    const invoice = await Invoice.create({
      barnId: req.barnId,
      boarderId: req.userId,
      createdById: req.userId,
      dueDate,
      charges,
      method: 'card',
      subscriptionTier: tier,
      subscriptionInterval: billingInterval,
      status: 'pending',
      paymentBreakdown: {
        subtotal: feeBreakdown.subtotal,
        processingFee: feeBreakdown.processingFee,
        platformFee: feeBreakdown.platformFee,
        total: feeBreakdown.total
      }
    });

    if (!stripe.isConfiguredSync()) {
      return res.status(503).json({
        error: 'Payment processing is not configured. Please contact support.'
      });
    }

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

    // Get barn's connected account
    const merchantApp = await MerchantApplication.findOne({ barnId: req.barnId });
    const connectedAccountId = merchantApp?.stripeConnect?.accountId;

    const paymentIntent = await stripe.createPaymentIntent({
      invoiceId: invoice._id.toString(),
      amount: feeBreakdown.total,
      currency: 'USD',
      connectedAccountId,
      platformFeePercent: 2.5,
      customerEmail: user.email,
      description: `${plan.name} Subscription - ${billingInterval}`,
      metadata: {
        barnId: req.barnId.toString(),
        userId: req.userId.toString(),
        subscriptionTier: tier,
        subscriptionInterval: billingInterval,
      },
    });

    invoice.stripePaymentInfo = {
      paymentIntentId: paymentIntent.paymentIntentId,
    };
    await invoice.save();

    return res.json({
      invoiceId: invoice._id.toString(),
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: feeBreakdown.total,
    });
  } catch (error) {
    next(error);
  }
});

// Get usage metrics
router.get('/usage', requireBarn, async (req, res, next) => {
  try {
    const now = new Date();
    const periodId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let metrics = await UsageMetrics.findOne({
      barnId: req.barnId,
      periodId
    });

    if (!metrics) {
      // Calculate current usage
      const [horseCount, userCount, lessonCount] = await Promise.all([
        require('../models/Horse').countDocuments({ barnId: req.barnId }),
        require('../models/UserBarnRole').countDocuments({ barnId: req.barnId, status: 'active' }),
        require('../models/Lesson').countDocuments({
          barnId: req.barnId,
          scheduledDate: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          }
        })
      ]);

      metrics = await UsageMetrics.create({
        barnId: req.barnId,
        periodId,
        horseCount,
        userCount,
        lessonCount
      });
    }

    // Get subscription limits
    const subscription = await BarnSubscription.findOne({ barnId: req.barnId });
    const plan = await SubscriptionPlan.findOne({ tier: subscription?.tier || 'free' });

    res.json({
      metrics,
      limits: plan ? {
        maxHorses: plan.maxHorses,
        maxUsers: plan.maxUsers,
        maxLessonsPerMonth: plan.maxLessonsPerMonth,
        maxBarns: plan.maxBarns
      } : null
    });
  } catch (error) {
    next(error);
  }
});

// Check feature access
router.get('/features/:feature', requireBarn, async (req, res, next) => {
  try {
    const subscription = await BarnSubscription.findOne({ barnId: req.barnId });
    const plan = await SubscriptionPlan.findOne({ tier: subscription?.tier || 'free' });

    const featureMap = {
      billing: plan?.hasBilling,
      fullBilling: plan?.hasFullBilling,
      aiFeatures: plan?.hasAiFeatures,
      multiBarn: plan?.hasMultiBarn,
      branding: plan?.hasBranding,
      apiAccess: plan?.hasApiAccess,
      prioritySupport: plan?.hasPrioritySupport
    };

    const hasFeature = featureMap[req.params.feature] || false;

    res.json({
      feature: req.params.feature,
      hasAccess: hasFeature,
      tier: subscription?.tier || 'free'
    });
  } catch (error) {
    next(error);
  }
});

// Create/update subscription
// Note: Paid plan activation is handled by updateSubscriptionAfterPayment() after
// successful Stripe payment via /checkout or /checkout-invoice flow.
// This endpoint handles direct tier changes (free tier, admin overrides).
router.post('/', [
  requireBarn,
  hasRole('owner'),
  body('tier').isIn(PLAN_TIERS),
  body('billingInterval').optional().isIn(['monthly', 'yearly']),
  validate
], async (req, res, next) => {
  try {
    const { tier, billingInterval } = req.body;

    const plan = await SubscriptionPlan.findOne({ tier });
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    let subscription = await BarnSubscription.findOne({ barnId: req.barnId });

    if (tier === 'free') {
      // Downgrade to free
      if (subscription) {
        subscription.tier = 'free';
        subscription.status = 'active';
        subscription.currentPeriodEnd = null;
        await subscription.save();
      } else {
        subscription = await BarnSubscription.create({
          barnId: req.barnId,
          tier: 'free',
          status: 'active'
        });
      }
    } else {
      // For paid plans, payment should go through /checkout or /checkout-invoice
      // which creates a Windcave payment session. After payment, the subscription
      // is activated via updateSubscriptionAfterPayment().
      // This direct path is kept for admin overrides and testing.
      if (subscription) {
        subscription.tier = tier;
        subscription.billingInterval = billingInterval || 'monthly';
        subscription.status = 'active';
        subscription.currentPeriodStart = new Date();
        subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await subscription.save();
      } else {
        subscription = await BarnSubscription.create({
          barnId: req.barnId,
          tier,
          billingInterval: billingInterval || 'monthly',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      }
    }

    res.json({
      subscription,
      plan
    });
  } catch (error) {
    next(error);
  }
});

// Cancel subscription
router.delete('/', [
  requireBarn,
  hasRole('owner')
], async (req, res, next) => {
  try {
    const subscription = await BarnSubscription.findOne({ barnId: req.barnId });

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    if (subscription.tier === 'free') {
      return res.status(400).json({ error: 'Cannot cancel free tier' });
    }

    subscription.cancelAtPeriodEnd = true;
    subscription.canceledAt = new Date();
    await subscription.save();

    res.json({
      message: 'Subscription will be canceled at end of billing period',
      subscription
    });
  } catch (error) {
    next(error);
  }
});

// Subscription payment status check
// Note: Stripe webhook handles payment_intent.succeeded which calls updateSubscriptionAfterPayment().
// This endpoint allows the client to check if a subscription payment has been processed.
router.get('/payment-status/:invoiceId', [
  requireBarn,
  hasRole('owner')
], async (req, res, next) => {
  try {
    const Invoice = require('../models/Invoice');
    const invoice = await Invoice.findById(req.params.invoiceId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.barnId.toString() !== req.barnId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const subscription = await BarnSubscription.findOne({ barnId: req.barnId });

    res.json({
      invoiceStatus: invoice.status,
      subscriptionTier: subscription?.tier || 'free',
      subscriptionStatus: subscription?.status || 'active',
      currentPeriodEnd: subscription?.currentPeriodEnd,
    });
  } catch (error) {
    next(error);
  }
});

// ============ Admin Routes ============

// Seed subscription plans (admin only); uses same default plans as GET /plans
router.post('/plans/seed', async (req, res, next) => {
  try {
    if (req.user?.accountType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    await ensurePlansExist();

    res.json({ message: 'Plans seeded successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
