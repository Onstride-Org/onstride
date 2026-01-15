const express = require('express');
const { body, param } = require('express-validator');
const { SubscriptionPlan, BarnSubscription, UsageMetrics } = require('../models/Subscription');
const { authenticate, loadBarnContext, requireBarn, hasRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Get available plans (public)
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ sortOrder: 1 });

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
router.post('/', [
  requireBarn,
  hasRole('owner'),
  body('tier').isIn(['free', 'basic', 'pro', 'enterprise']),
  body('billingInterval').optional().isIn(['monthly', 'yearly']),
  validate
], async (req, res, next) => {
  try {
    const { tier, billingInterval, paymentMethodId } = req.body;

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
        subscription.stripeSubscriptionId = null;
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
      // Paid plan - would integrate with Stripe here
      // TODO: Create Stripe subscription
      // const stripeSubscription = await stripe.subscriptions.create({...});

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

    // TODO: Cancel Stripe subscription
    // await stripe.subscriptions.update(subscription.stripeSubscriptionId, { cancel_at_period_end: true });

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

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    // TODO: Verify Stripe signature
    const event = JSON.parse(req.body);

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object;
        const subscription = await BarnSubscription.findOne({
          stripeSubscriptionId: stripeSubscription.id
        });

        if (subscription) {
          if (stripeSubscription.status === 'canceled') {
            subscription.status = 'canceled';
            subscription.tier = 'free';
          } else if (stripeSubscription.status === 'past_due') {
            subscription.status = 'pastDue';
          } else if (stripeSubscription.status === 'active') {
            subscription.status = 'active';
          }

          subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
          subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
          await subscription.save();
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscription = await BarnSubscription.findOne({
          stripeCustomerId: invoice.customer
        });

        if (subscription) {
          subscription.status = 'pastDue';
          await subscription.save();
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

// ============ Admin Routes ============

// Seed subscription plans (admin only)
router.post('/plans/seed', async (req, res, next) => {
  try {
    if (req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const plans = [
      {
        tier: 'free',
        name: 'Free',
        description: 'Basic barn management for small operations',
        monthlyPriceCents: 0,
        yearlyPriceCents: 0,
        maxHorses: 5,
        maxUsers: 3,
        maxLessonsPerMonth: 10,
        maxBarns: 1,
        hasBilling: false,
        hasFullBilling: false,
        hasAiFeatures: false,
        hasMultiBarn: false,
        hasBranding: false,
        hasApiAccess: false,
        sortOrder: 0
      },
      {
        tier: 'basic',
        name: 'Basic',
        description: 'Essential features for growing barns',
        monthlyPriceCents: 2900,
        yearlyPriceCents: 29000,
        maxHorses: 25,
        maxUsers: 10,
        maxLessonsPerMonth: 100,
        maxBarns: 1,
        hasBilling: true,
        hasFullBilling: false,
        hasAiFeatures: false,
        hasMultiBarn: false,
        hasBranding: false,
        hasApiAccess: false,
        sortOrder: 1
      },
      {
        tier: 'pro',
        name: 'Professional',
        description: 'Advanced features for professional operations',
        monthlyPriceCents: 7900,
        yearlyPriceCents: 79000,
        maxHorses: 100,
        maxUsers: 50,
        maxLessonsPerMonth: -1,
        maxBarns: 3,
        hasBilling: true,
        hasFullBilling: true,
        hasAiFeatures: true,
        hasMultiBarn: true,
        hasBranding: false,
        hasApiAccess: false,
        hasPrioritySupport: true,
        isPopular: true,
        sortOrder: 2
      },
      {
        tier: 'enterprise',
        name: 'Enterprise',
        description: 'Unlimited access for large operations',
        monthlyPriceCents: 19900,
        yearlyPriceCents: 199000,
        maxHorses: -1,
        maxUsers: -1,
        maxLessonsPerMonth: -1,
        maxBarns: -1,
        hasBilling: true,
        hasFullBilling: true,
        hasAiFeatures: true,
        hasMultiBarn: true,
        hasBranding: true,
        hasApiAccess: true,
        hasPrioritySupport: true,
        hasDedicatedSupport: true,
        sortOrder: 3
      }
    ];

    for (const plan of plans) {
      await SubscriptionPlan.findOneAndUpdate(
        { tier: plan.tier },
        plan,
        { upsert: true }
      );
    }

    res.json({ message: 'Plans seeded successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
