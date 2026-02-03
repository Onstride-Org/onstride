const { BarnSubscription } = require('../models/Subscription');

const BILLING_INTERVAL_DAYS = {
  monthly: 30,
  yearly: 365
};

const updateSubscriptionAfterPayment = async (invoice) => {
  if (!invoice.subscriptionTier || !invoice.subscriptionInterval) {
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
      await BarnSubscription.create({
        barnId: invoice.barnId,
        tier: invoice.subscriptionTier,
        billingInterval: interval,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd
      });
    }
  } catch (error) {
    console.error('Failed to update subscription after payment:', error);
  }
};

module.exports = {
  updateSubscriptionAfterPayment,
};
