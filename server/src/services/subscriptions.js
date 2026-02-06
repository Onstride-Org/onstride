const { BarnSubscription, SubscriptionPlan } = require('../models/Subscription');
const Barn = require('../models/Barn');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const emailService = require('./email');

const BILLING_INTERVAL_DAYS = {
  monthly: 30,
  yearly: 365
};

const updateSubscriptionAfterPayment = async (invoice) => {
  if (!invoice.subscriptionTier || !invoice.subscriptionInterval) {
    console.log('Invoice missing subscriptionTier or subscriptionInterval, skipping subscription update');
    return;
  }

  const interval = invoice.subscriptionInterval in BILLING_INTERVAL_DAYS
    ? invoice.subscriptionInterval
    : 'monthly';

  const days = BILLING_INTERVAL_DAYS[interval];
  const now = new Date();
  const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  try {
    let subscription = await BarnSubscription.findOne({ barnId: invoice.barnId });

    if (subscription) {
      subscription.tier = invoice.subscriptionTier;
      subscription.billingInterval = interval;
      subscription.status = 'active';
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = periodEnd;
      subscription.cancelAtPeriodEnd = false;
      subscription.canceledAt = null;
      await subscription.save();
    } else {
      subscription = await BarnSubscription.create({
        barnId: invoice.barnId,
        tier: invoice.subscriptionTier,
        billingInterval: interval,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd
      });
    }

    console.log(`Subscription updated: barnId=${invoice.barnId}, tier=${invoice.subscriptionTier}, status=active`);

    // Clean up failed/processing subscription invoices for this barn (except the current one)
    try {
      const cleanupResult = await Invoice.updateMany(
        {
          barnId: invoice.barnId,
          _id: { $ne: invoice._id },
          subscriptionTier: { $exists: true, $ne: null },
          status: { $in: ['failed', 'processing'] }
        },
        {
          $set: { deletedAt: new Date() }
        }
      );
      if (cleanupResult.modifiedCount > 0) {
        console.log(`Cleaned up ${cleanupResult.modifiedCount} failed/processing subscription invoices for barn ${invoice.barnId}`);
      }
    } catch (cleanupError) {
      console.error('Failed to cleanup old subscription invoices:', cleanupError.message);
      // Don't fail the main operation
    }

    // Send confirmation email
    try {
      const barn = await Barn.findById(invoice.barnId);
      const user = await User.findById(invoice.boarderId || invoice.createdById);
      const plan = await SubscriptionPlan.findOne({ tier: invoice.subscriptionTier });

      if (user?.email) {
        const amount = invoice.paymentBreakdown?.subtotal ||
          (invoice.charges?.reduce((sum, c) => sum + (c.amount * (c.quantity || 1)), 0)) || 0;

        await emailService.sendSubscriptionConfirmationEmail({
          to: user.email,
          name: user.name || '',
          barnName: barn?.name || 'Your barn',
          planName: plan?.name || invoice.subscriptionTier,
          amount,
          billingInterval: interval
        });
        console.log(`Subscription confirmation email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send subscription confirmation email:', emailError.message);
      // Don't fail the whole operation for email errors
    }
  } catch (error) {
    console.error('Failed to update subscription after payment:', error);
    throw error; // Re-throw so caller knows it failed
  }
};

module.exports = {
  updateSubscriptionAfterPayment,
};
