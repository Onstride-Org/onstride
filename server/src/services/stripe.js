/**
 * Stripe Payment Gateway Service
 *
 * Implements Stripe Connect for multi-tenant payments
 * Each barn can onboard as a connected account
 *
 * This service supports:
 * - Stripe Connect onboarding (Standard/Express accounts)
 * - PaymentIntents for invoice payments
 * - Refunds
 * - Webhook signature verification
 */

const Stripe = require('stripe');

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Check if Stripe is configured
 */
const isConfigured = () => {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
};

// ============================================
// STRIPE CONNECT - MERCHANT ONBOARDING
// ============================================

/**
 * Create a Stripe Connect account for a barn
 * Using Standard accounts for full Stripe dashboard access
 *
 * @param {Object} options - Account options
 * @param {string} options.email - Barn owner's email
 * @param {string} options.barnName - Barn name for business profile
 * @param {string} options.barnId - Internal barn ID (stored in metadata)
 * @returns {Object} Created account with ID
 */
const createConnectAccount = async ({ email, barnName, barnId }) => {
  try {
    const account = await stripe.accounts.create({
      type: 'standard', // Standard accounts - barn manages their own Stripe dashboard
      email,
      business_profile: {
        name: barnName,
        product_description: 'Equine boarding, training, lessons, and related services',
        mcc: '7997', // Membership Clubs (Sports/Recreation)
      },
      metadata: {
        barnId,
        platform: 'onstride',
      },
    });

    return {
      accountId: account.id,
      email: account.email,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    };
  } catch (error) {
    console.error('Stripe Connect account creation error:', error.message);
    throw new Error(error.message || 'Failed to create Stripe account');
  }
};

/**
 * Create an account link for onboarding
 * This redirects the barn owner to Stripe's onboarding flow
 *
 * @param {string} accountId - Stripe Connect account ID
 * @param {string} refreshUrl - URL to redirect if link expires
 * @param {string} returnUrl - URL to redirect after completion
 * @returns {Object} Account link with URL
 */
const createAccountLink = async (accountId, refreshUrl, returnUrl) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return {
      url: accountLink.url,
      expiresAt: new Date(accountLink.expires_at * 1000),
    };
  } catch (error) {
    console.error('Stripe account link error:', error.message);
    throw new Error(error.message || 'Failed to create onboarding link');
  }
};

/**
 * Create a login link for the connected account's Stripe dashboard
 *
 * @param {string} accountId - Stripe Connect account ID
 * @returns {Object} Login link with URL
 */
const createLoginLink = async (accountId) => {
  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return { url: loginLink.url };
  } catch (error) {
    console.error('Stripe login link error:', error.message);
    throw new Error(error.message || 'Failed to create dashboard link');
  }
};

/**
 * Retrieve a connected account's details
 *
 * @param {string} accountId - Stripe Connect account ID
 * @returns {Object} Account details including capabilities
 */
const retrieveAccount = async (accountId) => {
  try {
    const account = await stripe.accounts.retrieve(accountId);

    return {
      accountId: account.id,
      email: account.email,
      businessName: account.business_profile?.name,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requiresAction: !account.details_submitted || !account.charges_enabled,
      requirements: account.requirements,
    };
  } catch (error) {
    console.error('Stripe account retrieval error:', error.message);
    throw new Error(error.message || 'Failed to retrieve account');
  }
};

// ============================================
// PAYMENT INTENTS - INVOICE PAYMENTS
// ============================================

/**
 * Create a PaymentIntent for an invoice
 * Funds go to the connected account with an optional platform fee
 *
 * @param {Object} options - Payment options
 * @param {string} options.invoiceId - Internal invoice ID
 * @param {number} options.amount - Amount in dollars
 * @param {string} options.currency - Currency code (default: USD)
 * @param {string} options.connectedAccountId - Barn's Stripe Connect account ID
 * @param {number} options.platformFeePercent - Platform fee percentage (default: 2.5%)
 * @param {string} options.customerEmail - Customer email for receipt
 * @param {string} options.description - Payment description
 * @param {Object} options.metadata - Additional metadata
 * @returns {Object} PaymentIntent with client secret
 */
const createPaymentIntent = async ({
  invoiceId,
  amount,
  currency = 'usd',
  connectedAccountId,
  platformFeePercent = 2.5,
  customerEmail,
  description,
  metadata = {},
}) => {
  try {
    // Convert amount to cents
    const amountCents = Math.round(amount * 100);

    // Calculate platform fee (in cents)
    const platformFeeCents = Math.round(amountCents * (platformFeePercent / 100));

    const paymentIntentParams = {
      amount: amountCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      description: description || `Invoice payment #${invoiceId}`,
      metadata: {
        invoiceId,
        ...metadata,
      },
      receipt_email: customerEmail,
    };

    // If connected account exists, use destination charges
    // Platform keeps the fee, rest goes to connected account
    if (connectedAccountId) {
      paymentIntentParams.transfer_data = {
        destination: connectedAccountId,
      };
      // Only set application fee if there's a connected account
      if (platformFeeCents > 0) {
        paymentIntentParams.application_fee_amount = platformFeeCents;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error('Stripe PaymentIntent error:', error.message);
    throw new Error(error.message || 'Failed to create payment');
  }
};

/**
 * Retrieve a PaymentIntent's current status
 *
 * @param {string} paymentIntentId - PaymentIntent ID
 * @returns {Object} PaymentIntent details
 */
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'payment_method'],
    });

    const charge = paymentIntent.latest_charge;
    const paymentMethod = paymentIntent.payment_method;

    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      chargeId: charge?.id,
      receiptUrl: charge?.receipt_url,
      paymentMethodType: paymentMethod?.type,
      // Card details if available
      card: paymentMethod?.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      } : null,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error('Stripe PaymentIntent retrieval error:', error.message);
    throw new Error(error.message || 'Failed to retrieve payment');
  }
};

// ============================================
// REFUNDS
// ============================================

/**
 * Process a refund for a payment
 *
 * @param {Object} options - Refund options
 * @param {string} options.paymentIntentId - PaymentIntent ID to refund
 * @param {number} options.amount - Amount to refund in dollars (optional - full refund if omitted)
 * @param {string} options.reason - Refund reason (duplicate, fraudulent, requested_by_customer)
 * @param {Object} options.metadata - Additional metadata
 * @returns {Object} Refund details
 */
const processRefund = async ({
  paymentIntentId,
  amount,
  reason = 'requested_by_customer',
  metadata = {},
}) => {
  try {
    const refundParams = {
      payment_intent: paymentIntentId,
      reason,
      metadata,
    };

    // If amount specified, convert to cents for partial refund
    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      refundId: refund.id,
      amount: refund.amount / 100,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
    };
  } catch (error) {
    console.error('Stripe refund error:', error.message);
    throw new Error(error.message || 'Failed to process refund');
  }
};

// ============================================
// WEBHOOKS
// ============================================

/**
 * Verify Stripe webhook signature
 *
 * @param {Buffer|string} rawBody - Raw request body
 * @param {string} signature - Stripe-Signature header
 * @returns {Object} Verified webhook event
 */
const verifyWebhookSignature = (rawBody, signature) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Stripe webhook verification error:', error.message);
    throw new Error('Invalid webhook signature');
  }
};

// ============================================
// FEE CALCULATIONS
// ============================================

/**
 * Calculate Stripe processing fees (estimate)
 * Standard Stripe rate: 2.9% + $0.30 for cards
 *
 * @param {number} amount - Transaction amount in dollars
 * @param {string} method - Payment method hint (card, ach)
 * @param {number} platformFeePercent - Platform fee percentage
 * @returns {Object} Fee breakdown
 */
const calculateFees = (amount, method = 'card', platformFeePercent = 2.5) => {
  const toCents = (value) => Math.round(value * 100);
  const fromCents = (value) => Math.round(value) / 100;

  const subtotalCents = toCents(amount);

  // Calculate platform fee
  const platformFeeCents = Math.round(subtotalCents * (platformFeePercent / 100));

  // Estimate Stripe processing fee
  // Card: 2.9% + $0.30
  // ACH: 0.8% capped at $5
  let processingFeeCents = 0;

  const normalizedMethod = (method || 'card').toString().toLowerCase();
  if (normalizedMethod === 'ach' || normalizedMethod === 'us_bank_account') {
    // ACH: 0.8% capped at $5
    processingFeeCents = Math.round(subtotalCents * 0.008);
    processingFeeCents = Math.min(processingFeeCents, 500);
  } else {
    // Card: 2.9% + $0.30
    processingFeeCents = Math.round(subtotalCents * 0.029) + 30;
  }

  return {
    subtotal: fromCents(subtotalCents),
    processingFee: fromCents(processingFeeCents),
    platformFee: fromCents(platformFeeCents),
    total: fromCents(subtotalCents + processingFeeCents),
  };
};

module.exports = {
  stripe, // Export raw stripe instance for advanced usage
  isConfigured,
  // Connect
  createConnectAccount,
  createAccountLink,
  createLoginLink,
  retrieveAccount,
  // Payments
  createPaymentIntent,
  retrievePaymentIntent,
  // Refunds
  processRefund,
  // Webhooks
  verifyWebhookSignature,
  // Utils
  calculateFees,
};
