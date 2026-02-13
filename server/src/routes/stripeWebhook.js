/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for:
 * - Payment status updates
 * - Subscription lifecycle
 * - Disputes/Chargebacks
 * - Payout status
 * - Account updates
 *
 * IMPORTANT: This must be registered BEFORE express.json() middleware
 * to receive the raw body for signature verification
 */

const express = require('express');
const Invoice = require('../models/Invoice');
const MerchantApplication = require('../models/MerchantApplication');
const { BarnSubscription } = require('../models/Subscription');
const stripe = require('../services/stripe');
const { updateSubscriptionAfterPayment } = require('../services/subscriptions');

const router = express.Router();

/**
 * POST /api/stripe/webhook
 * Stripe webhook endpoint
 * Note: This route uses express.raw() middleware, not express.json()
 */
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    console.error('Stripe webhook: No signature header');
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event;

  try {
    event = stripe.verifyWebhookSignature(req.body, signature);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  console.log(`Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      // Payment events
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      // Subscription events
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      // Dispute events
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;

      case 'charge.dispute.updated':
        await handleDisputeUpdated(event.data.object);
        break;

      case 'charge.dispute.closed':
        await handleDisputeClosed(event.data.object);
        break;

      // Payout events
      case 'payout.paid':
        await handlePayoutPaid(event.data.object);
        break;

      case 'payout.failed':
        await handlePayoutFailed(event.data.object);
        break;

      // Account events
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`Stripe webhook error handling ${event.type}:`, error);
    // Return 200 anyway to prevent Stripe from retrying
    // We log the error for investigation
    res.json({ received: true, error: error.message });
  }
});

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);

  const invoiceId = paymentIntent.metadata?.invoiceId;

  if (!invoiceId) {
    console.log('No invoiceId in payment metadata, skipping');
    return;
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    console.error(`Invoice not found for payment: ${invoiceId}`);
    return;
  }

  // Don't update if already paid (idempotency)
  if (invoice.status === 'paid') {
    console.log(`Invoice ${invoiceId} already marked as paid`);
    return;
  }

  // Get payment method details
  let cardDetails = null;
  if (paymentIntent.payment_method) {
    try {
      const pm = await stripe.stripe.paymentMethods.retrieve(paymentIntent.payment_method);
      if (pm.card) {
        cardDetails = {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        };
      }
    } catch (err) {
      console.error('Error fetching payment method:', err.message);
    }
  }

  // Update invoice
  invoice.status = 'paid';
  invoice.paidAt = new Date();
  invoice.method = 'card';
  invoice.stripePaymentInfo = {
    paymentIntentId: paymentIntent.id,
    chargeId: paymentIntent.latest_charge,
    paymentMethodType: paymentIntent.payment_method_types?.[0] || 'card',
    last4Digits: cardDetails?.last4,
    brand: cardDetails?.brand,
    receiptUrl: null, // Will be populated if we fetch the charge
  };

  // Try to get receipt URL from charge
  if (paymentIntent.latest_charge) {
    try {
      const charge = await stripe.stripe.charges.retrieve(paymentIntent.latest_charge);
      invoice.stripePaymentInfo.receiptUrl = charge.receipt_url;
    } catch (err) {
      console.error('Error fetching charge:', err.message);
    }
  }

  await invoice.save();

  console.log(`Invoice ${invoiceId} marked as paid`);

  // Update subscription if this was a subscription payment
  if (invoice.subscriptionTier) {
    console.log(`Processing subscription update for tier: ${invoice.subscriptionTier}`);
    await updateSubscriptionAfterPayment(invoice);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);

  const invoiceId = paymentIntent.metadata?.invoiceId;

  if (!invoiceId) {
    console.log('No invoiceId in payment metadata, skipping');
    return;
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    console.error(`Invoice not found for payment: ${invoiceId}`);
    return;
  }

  // Don't update if already paid
  if (invoice.status === 'paid') {
    console.log(`Invoice ${invoiceId} already paid, ignoring failure`);
    return;
  }

  const lastError = paymentIntent.last_payment_error;

  invoice.status = 'failed';
  invoice.failureReason = lastError?.message || 'Payment failed';
  invoice.stripePaymentInfo = {
    paymentIntentId: paymentIntent.id,
    failedAt: new Date(),
    errorCode: lastError?.code,
    errorMessage: lastError?.message,
  };

  await invoice.save();

  console.log(`Invoice ${invoiceId} marked as failed: ${invoice.failureReason}`);
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge) {
  console.log(`Charge refunded: ${charge.id}`);

  // Find invoice by charge ID
  const invoice = await Invoice.findOne({
    'stripePaymentInfo.chargeId': charge.id,
  });

  if (!invoice) {
    console.log(`No invoice found for charge ${charge.id}`);
    return;
  }

  // Check if fully refunded
  if (charge.refunded) {
    invoice.status = 'refunded';
    invoice.refundInfo = {
      refundId: charge.refunds?.data?.[0]?.id,
      amount: charge.amount_refunded / 100,
      refundedAt: new Date(),
      reason: charge.refunds?.data?.[0]?.reason || 'Refund processed',
    };
    await invoice.save();
    console.log(`Invoice ${invoice._id} marked as refunded`);
  }
}

/**
 * Handle Connect account updates
 * Used to update local cache of account capabilities
 */
async function handleAccountUpdated(account) {
  console.log(`Account updated: ${account.id}`);

  const merchantApp = await MerchantApplication.findOne({
    'stripeConnect.accountId': account.id,
  });

  if (!merchantApp) {
    console.log(`No merchant application found for account ${account.id}`);
    return;
  }

  // Update cached capabilities
  merchantApp.stripeConnect.chargesEnabled = account.charges_enabled;
  merchantApp.stripeConnect.payoutsEnabled = account.payouts_enabled;
  merchantApp.stripeConnect.detailsSubmitted = account.details_submitted;

  if (account.charges_enabled && !merchantApp.stripeConnect.onboardingCompletedAt) {
    merchantApp.stripeConnect.onboardingCompletedAt = new Date();
    merchantApp.status = 'approved';
    merchantApp.approvedAt = new Date();
  }

  await merchantApp.save();

  console.log(`Updated merchant application for account ${account.id}`);
}

// ============================================
// SUBSCRIPTION EVENT HANDLERS
// ============================================

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  console.log(`Subscription created: ${subscription.id}`);

  // Find barn subscription by Stripe subscription ID or customer metadata
  const barnId = subscription.metadata?.barnId;

  if (!barnId) {
    console.log('No barnId in subscription metadata, skipping');
    return;
  }

  // Update or create barn subscription record
  let barnSubscription = await BarnSubscription.findOne({ barnId });

  if (!barnSubscription) {
    barnSubscription = new BarnSubscription({ barnId });
  }

  barnSubscription.stripeSubscriptionId = subscription.id;
  barnSubscription.stripeCustomerId = subscription.customer;
  barnSubscription.status = subscription.status;
  barnSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  barnSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await barnSubscription.save();

  console.log(`Barn subscription updated for barn ${barnId}`);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  console.log(`Subscription updated: ${subscription.id}`);

  const barnSubscription = await BarnSubscription.findOne({
    stripeSubscriptionId: subscription.id,
  });

  if (!barnSubscription) {
    console.log(`No barn subscription found for ${subscription.id}`);
    return;
  }

  // Update subscription details
  barnSubscription.status = subscription.status;
  barnSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  barnSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  barnSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;

  if (subscription.canceled_at) {
    barnSubscription.canceledAt = new Date(subscription.canceled_at * 1000);
  }

  await barnSubscription.save();

  console.log(`Barn subscription ${subscription.id} updated to status: ${subscription.status}`);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);

  const barnSubscription = await BarnSubscription.findOne({
    stripeSubscriptionId: subscription.id,
  });

  if (!barnSubscription) {
    console.log(`No barn subscription found for ${subscription.id}`);
    return;
  }

  barnSubscription.status = 'canceled';
  barnSubscription.canceledAt = new Date();

  await barnSubscription.save();

  console.log(`Barn subscription ${subscription.id} marked as canceled`);
}

/**
 * Handle Stripe invoice paid (for subscriptions)
 */
async function handleInvoicePaid(invoice) {
  console.log(`Invoice paid: ${invoice.id}`);

  // Only process subscription invoices
  if (!invoice.subscription) {
    return;
  }

  const barnSubscription = await BarnSubscription.findOne({
    stripeSubscriptionId: invoice.subscription,
  });

  if (!barnSubscription) {
    console.log(`No barn subscription found for subscription ${invoice.subscription}`);
    return;
  }

  // Log payment
  barnSubscription.lastPaymentAt = new Date();
  barnSubscription.lastPaymentAmount = invoice.amount_paid / 100;

  // Add to payment history
  if (!barnSubscription.paymentHistory) {
    barnSubscription.paymentHistory = [];
  }

  barnSubscription.paymentHistory.push({
    invoiceId: invoice.id,
    amount: invoice.amount_paid / 100,
    paidAt: new Date(),
    periodStart: new Date(invoice.period_start * 1000),
    periodEnd: new Date(invoice.period_end * 1000),
  });

  await barnSubscription.save();

  console.log(`Recorded payment for subscription ${invoice.subscription}`);
}

/**
 * Handle Stripe invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice) {
  console.log(`Invoice payment failed: ${invoice.id}`);

  if (!invoice.subscription) {
    return;
  }

  const barnSubscription = await BarnSubscription.findOne({
    stripeSubscriptionId: invoice.subscription,
  });

  if (!barnSubscription) {
    console.log(`No barn subscription found for subscription ${invoice.subscription}`);
    return;
  }

  barnSubscription.lastPaymentFailedAt = new Date();
  barnSubscription.lastPaymentFailedReason = invoice.last_finalization_error?.message || 'Payment failed';

  await barnSubscription.save();

  // TODO: Send notification email about failed payment
  console.log(`Recorded payment failure for subscription ${invoice.subscription}`);
}

// ============================================
// DISPUTE EVENT HANDLERS
// ============================================

/**
 * Handle dispute created
 */
async function handleDisputeCreated(dispute) {
  console.log(`Dispute created: ${dispute.id} for charge ${dispute.charge}`);

  // Find the invoice associated with this charge
  const invoice = await Invoice.findOne({
    'stripePaymentInfo.chargeId': dispute.charge,
  });

  if (!invoice) {
    console.log(`No invoice found for charge ${dispute.charge}`);
    return;
  }

  // Store dispute info on invoice
  invoice.disputeInfo = {
    disputeId: dispute.id,
    amount: dispute.amount / 100,
    reason: dispute.reason,
    status: dispute.status,
    createdAt: new Date(dispute.created * 1000),
    evidenceDueBy: dispute.evidence_details?.due_by
      ? new Date(dispute.evidence_details.due_by * 1000)
      : null,
  };

  await invoice.save();

  // TODO: Send notification email to barn owner about dispute
  console.log(`Dispute ${dispute.id} recorded for invoice ${invoice._id}`);
}

/**
 * Handle dispute updated
 */
async function handleDisputeUpdated(dispute) {
  console.log(`Dispute updated: ${dispute.id}`);

  const invoice = await Invoice.findOne({
    'disputeInfo.disputeId': dispute.id,
  });

  if (!invoice) {
    console.log(`No invoice found for dispute ${dispute.id}`);
    return;
  }

  invoice.disputeInfo.status = dispute.status;
  invoice.disputeInfo.updatedAt = new Date();

  await invoice.save();

  console.log(`Dispute ${dispute.id} status updated to ${dispute.status}`);
}

/**
 * Handle dispute closed
 */
async function handleDisputeClosed(dispute) {
  console.log(`Dispute closed: ${dispute.id} with status ${dispute.status}`);

  const invoice = await Invoice.findOne({
    'disputeInfo.disputeId': dispute.id,
  });

  if (!invoice) {
    console.log(`No invoice found for dispute ${dispute.id}`);
    return;
  }

  invoice.disputeInfo.status = dispute.status;
  invoice.disputeInfo.closedAt = new Date();
  invoice.disputeInfo.outcome = dispute.status; // won, lost, warning_closed, etc.

  // If dispute was lost, update invoice status
  if (dispute.status === 'lost') {
    invoice.status = 'disputed_lost';
  } else if (dispute.status === 'won') {
    invoice.disputeInfo.wonAt = new Date();
  }

  await invoice.save();

  // TODO: Send notification email about dispute resolution
  console.log(`Dispute ${dispute.id} closed with outcome: ${dispute.status}`);
}

// ============================================
// PAYOUT EVENT HANDLERS
// ============================================

/**
 * Handle payout paid
 */
async function handlePayoutPaid(payout) {
  console.log(`Payout paid: ${payout.id}, amount: ${payout.amount / 100} ${payout.currency}`);

  // Find merchant application by connected account
  // The payout event is sent to the connected account, so we need to find which barn it belongs to
  // This is typically handled by storing payout info or sending notifications

  // For now, just log it - in production you'd store this in a payouts collection
  // and potentially notify the barn owner

  console.log(`Payout ${payout.id} completed: $${payout.amount / 100} arriving on ${new Date(payout.arrival_date * 1000).toDateString()}`);
}

/**
 * Handle payout failed
 */
async function handlePayoutFailed(payout) {
  console.log(`Payout failed: ${payout.id}`);
  console.log(`Failure reason: ${payout.failure_code} - ${payout.failure_message}`);

  // In production, you'd:
  // 1. Store the failure in a payouts collection
  // 2. Send notification to barn owner
  // 3. Potentially trigger retry logic
}

module.exports = router;
