/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for payment status updates
 * IMPORTANT: This must be registered BEFORE express.json() middleware
 * to receive the raw body for signature verification
 */

const express = require('express');
const Invoice = require('../models/Invoice');
const MerchantApplication = require('../models/MerchantApplication');
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
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

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

module.exports = router;
