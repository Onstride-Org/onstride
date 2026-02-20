/**
 * Stripe Payment Gateway Service
 *
 * Implements Stripe Connect for multi-tenant payments
 * Each barn can onboard as a connected account
 *
 * This service supports:
 * - Stripe Connect onboarding (Standard/Express accounts)
 * - PaymentIntents for invoice payments
 * - Subscriptions / Recurring billing
 * - Saved payment methods (Customers)
 * - Refunds
 * - Dispute/Chargeback handling
 * - Payout tracking
 * - Webhook signature verification
 *
 * Configuration priority:
 * 1. Database (PlatformSettings) - can be updated by admin
 * 2. Environment variables - fallback
 */

const Stripe = require('stripe');

// Cache for platform settings
let cachedSettings = null;
let cacheExpiry = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Get Stripe credentials (from DB or env)
 * Uses caching to avoid hitting DB on every request
 */
const getCredentials = async () => {
  // Check cache first
  if (cachedSettings && Date.now() < cacheExpiry) {
    return cachedSettings;
  }

  try {
    // Lazy load to avoid circular dependency
    const PlatformSettings = require('../models/PlatformSettings');
    const settings = await PlatformSettings.getSettings();

    // Check if DB has valid credentials
    const dbSecretKey = settings.getStripeSecretKey();
    const dbPublishableKey = settings.stripe?.publishableKey;
    const dbWebhookSecret = settings.getStripeWebhookSecret();

    if (dbSecretKey && dbPublishableKey) {
      cachedSettings = {
        secretKey: dbSecretKey,
        publishableKey: dbPublishableKey,
        webhookSecret: dbWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
        platformFeePercent: settings.stripe?.platformFeePercent || 2.5,
        source: 'database',
      };
    } else {
      // Fall back to env vars
      cachedSettings = {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        platformFeePercent: parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT) || 2.5,
        source: 'environment',
      };
    }

    cacheExpiry = Date.now() + CACHE_TTL;
    return cachedSettings;
  } catch (error) {
    // If DB fails, fall back to env vars
    console.error('Failed to load Stripe credentials from DB:', error.message);
    return {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      platformFeePercent: parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT) || 2.5,
      source: 'environment',
    };
  }
};

/**
 * Clear credentials cache (call after admin updates settings)
 */
const clearCredentialsCache = () => {
  cachedSettings = null;
  cacheExpiry = 0;
};

/**
 * Get a Stripe instance with current credentials
 */
const getStripeInstance = async () => {
  const creds = await getCredentials();
  if (!creds.secretKey) {
    throw new Error('Stripe secret key not configured');
  }
  return new Stripe(creds.secretKey, { apiVersion: '2023-10-16' });
};

// Initialize default Stripe instance with env var (for backwards compat)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder', {
  apiVersion: '2023-10-16',
});

/**
 * Check if Stripe is configured
 */
const isConfigured = async () => {
  const creds = await getCredentials();
  return !!(creds.secretKey && creds.publishableKey);
};

/**
 * Synchronous check (uses cache or env vars)
 */
const isConfiguredSync = () => {
  if (cachedSettings) {
    return !!(cachedSettings.secretKey && cachedSettings.publishableKey);
  }
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
};

/**
 * Get publishable key for frontend
 */
const getPublishableKey = async () => {
  const creds = await getCredentials();
  // Ensure we always return a string or null
  const key = creds.publishableKey;
  return typeof key === 'string' ? key : null;
};

/**
 * Synchronous version (uses cache or env vars)
 */
const getPublishableKeySync = () => {
  if (cachedSettings) {
    return cachedSettings.publishableKey;
  }
  return process.env.STRIPE_PUBLISHABLE_KEY;
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

// ============================================
// CUSTOMERS - SAVED PAYMENT METHODS
// ============================================

/**
 * Create or retrieve a Stripe Customer for a user
 *
 * @param {Object} options - Customer options
 * @param {string} options.email - Customer email
 * @param {string} options.name - Customer name
 * @param {string} options.userId - Internal user ID (stored in metadata)
 * @param {string} options.barnId - Internal barn ID (stored in metadata)
 * @returns {Object} Customer object
 */
const createOrRetrieveCustomer = async ({ email, name, userId, barnId }) => {
  try {
    // First, try to find existing customer by email and metadata
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      // Update metadata if needed
      if (customer.metadata?.userId !== userId) {
        await stripe.customers.update(customer.id, {
          metadata: { userId, barnId },
        });
      }
      return {
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
        isNew: false,
      };
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
        barnId,
        platform: 'onstride',
      },
    });

    return {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      isNew: true,
    };
  } catch (error) {
    console.error('Stripe customer error:', error.message);
    throw new Error(error.message || 'Failed to create customer');
  }
};

/**
 * Attach a payment method to a customer
 *
 * @param {string} customerId - Stripe Customer ID
 * @param {string} paymentMethodId - Stripe PaymentMethod ID
 * @param {boolean} setDefault - Set as default payment method
 * @returns {Object} Payment method details
 */
const attachPaymentMethod = async (customerId, paymentMethodId, setDefault = true) => {
  try {
    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default if requested
    if (setDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    return {
      paymentMethodId: paymentMethod.id,
      type: paymentMethod.type,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      } : null,
      isDefault: setDefault,
    };
  } catch (error) {
    console.error('Stripe attach payment method error:', error.message);
    throw new Error(error.message || 'Failed to attach payment method');
  }
};

/**
 * List saved payment methods for a customer
 *
 * @param {string} customerId - Stripe Customer ID
 * @param {string} type - Payment method type (default: 'card')
 * @returns {Array} List of payment methods
 */
const listPaymentMethods = async (customerId, type = 'card') => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type,
    });

    // Get customer to find default payment method
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

    return paymentMethods.data.map(pm => ({
      paymentMethodId: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      } : null,
      isDefault: pm.id === defaultPaymentMethodId,
      created: new Date(pm.created * 1000),
    }));
  } catch (error) {
    console.error('Stripe list payment methods error:', error.message);
    throw new Error(error.message || 'Failed to list payment methods');
  }
};

/**
 * Detach a payment method from a customer
 *
 * @param {string} paymentMethodId - Stripe PaymentMethod ID
 * @returns {Object} Detached payment method
 */
const detachPaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return {
      paymentMethodId: paymentMethod.id,
      detached: true,
    };
  } catch (error) {
    console.error('Stripe detach payment method error:', error.message);
    throw new Error(error.message || 'Failed to detach payment method');
  }
};

/**
 * Create a SetupIntent for saving a payment method
 *
 * @param {string} customerId - Stripe Customer ID
 * @returns {Object} SetupIntent with client secret
 */
const createSetupIntent = async (customerId) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      setupIntentId: setupIntent.id,
      clientSecret: setupIntent.client_secret,
      status: setupIntent.status,
    };
  } catch (error) {
    console.error('Stripe setup intent error:', error.message);
    throw new Error(error.message || 'Failed to create setup intent');
  }
};

// ============================================
// SUBSCRIPTIONS - RECURRING BILLING
// ============================================

/**
 * Create a subscription product and price
 *
 * @param {Object} options - Product options
 * @param {string} options.name - Product name
 * @param {string} options.description - Product description
 * @param {number} options.amount - Price in dollars
 * @param {string} options.interval - Billing interval (month, year)
 * @param {string} options.connectedAccountId - Connected account ID (optional)
 * @returns {Object} Product and price IDs
 */
const createSubscriptionProduct = async ({
  name,
  description,
  amount,
  interval = 'month',
  connectedAccountId,
}) => {
  try {
    const params = connectedAccountId ? { stripeAccount: connectedAccountId } : {};

    // Create product
    const product = await stripe.products.create({
      name,
      description,
      metadata: {
        platform: 'onstride',
      },
    }, params);

    // Create price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100),
      currency: 'usd',
      recurring: {
        interval,
      },
    }, params);

    return {
      productId: product.id,
      priceId: price.id,
      name: product.name,
      amount: amount,
      interval,
    };
  } catch (error) {
    console.error('Stripe subscription product error:', error.message);
    throw new Error(error.message || 'Failed to create subscription product');
  }
};

/**
 * Create a subscription for a customer
 *
 * @param {Object} options - Subscription options
 * @param {string} options.customerId - Stripe Customer ID
 * @param {string} options.priceId - Stripe Price ID
 * @param {string} options.paymentMethodId - Payment method to use (optional)
 * @param {string} options.connectedAccountId - Connected account ID (optional)
 * @param {number} options.applicationFeePercent - Platform fee percentage
 * @param {Object} options.metadata - Additional metadata
 * @returns {Object} Subscription details
 */
const createSubscription = async ({
  customerId,
  priceId,
  paymentMethodId,
  connectedAccountId,
  applicationFeePercent = 2.5,
  metadata = {},
}) => {
  try {
    const subscriptionParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata,
    };

    // Set default payment method if provided
    if (paymentMethodId) {
      subscriptionParams.default_payment_method = paymentMethodId;
    }

    // Add application fee for connected accounts
    if (connectedAccountId) {
      subscriptionParams.application_fee_percent = applicationFeePercent;
      subscriptionParams.transfer_data = {
        destination: connectedAccountId,
      };
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      invoiceId: subscription.latest_invoice?.id,
    };
  } catch (error) {
    console.error('Stripe subscription creation error:', error.message);
    throw new Error(error.message || 'Failed to create subscription');
  }
};

/**
 * Cancel a subscription
 *
 * @param {string} subscriptionId - Stripe Subscription ID
 * @param {boolean} immediately - Cancel immediately vs at period end
 * @returns {Object} Cancelled subscription details
 */
const cancelSubscription = async (subscriptionId, immediately = false) => {
  try {
    let subscription;

    if (immediately) {
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    } else {
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
  } catch (error) {
    console.error('Stripe subscription cancellation error:', error.message);
    throw new Error(error.message || 'Failed to cancel subscription');
  }
};

/**
 * Retrieve subscription details
 *
 * @param {string} subscriptionId - Stripe Subscription ID
 * @returns {Object} Subscription details
 */
const retrieveSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'latest_invoice'],
    });

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      defaultPaymentMethod: subscription.default_payment_method ? {
        id: subscription.default_payment_method.id,
        brand: subscription.default_payment_method.card?.brand,
        last4: subscription.default_payment_method.card?.last4,
      } : null,
      latestInvoice: subscription.latest_invoice ? {
        id: subscription.latest_invoice.id,
        status: subscription.latest_invoice.status,
        amountDue: subscription.latest_invoice.amount_due / 100,
      } : null,
    };
  } catch (error) {
    console.error('Stripe subscription retrieval error:', error.message);
    throw new Error(error.message || 'Failed to retrieve subscription');
  }
};

/**
 * Update subscription (change plan, payment method, etc.)
 *
 * @param {string} subscriptionId - Stripe Subscription ID
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated subscription
 */
const updateSubscription = async (subscriptionId, updates) => {
  try {
    const updateParams = {};

    if (updates.priceId) {
      // Get current subscription to find the item ID
      const currentSub = await stripe.subscriptions.retrieve(subscriptionId);
      updateParams.items = [{
        id: currentSub.items.data[0].id,
        price: updates.priceId,
      }];
      updateParams.proration_behavior = updates.proration || 'create_prorations';
    }

    if (updates.paymentMethodId) {
      updateParams.default_payment_method = updates.paymentMethodId;
    }

    if (updates.metadata) {
      updateParams.metadata = updates.metadata;
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, updateParams);

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
  } catch (error) {
    console.error('Stripe subscription update error:', error.message);
    throw new Error(error.message || 'Failed to update subscription');
  }
};

// ============================================
// DISPUTES / CHARGEBACKS
// ============================================

/**
 * Retrieve dispute details
 *
 * @param {string} disputeId - Stripe Dispute ID
 * @returns {Object} Dispute details
 */
const retrieveDispute = async (disputeId) => {
  try {
    const dispute = await stripe.disputes.retrieve(disputeId);

    return {
      disputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount / 100,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      created: new Date(dispute.created * 1000),
      evidenceDueBy: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000)
        : null,
      isChargeRefundable: dispute.is_charge_refundable,
    };
  } catch (error) {
    console.error('Stripe dispute retrieval error:', error.message);
    throw new Error(error.message || 'Failed to retrieve dispute');
  }
};

/**
 * Submit evidence for a dispute
 *
 * @param {string} disputeId - Stripe Dispute ID
 * @param {Object} evidence - Evidence to submit
 * @returns {Object} Updated dispute
 */
const submitDisputeEvidence = async (disputeId, evidence) => {
  try {
    const dispute = await stripe.disputes.update(disputeId, {
      evidence: {
        customer_name: evidence.customerName,
        customer_email_address: evidence.customerEmail,
        product_description: evidence.productDescription,
        uncategorized_text: evidence.additionalDetails,
        // Add receipts/documentation as file IDs if provided
        ...(evidence.receiptFileId && { receipt: evidence.receiptFileId }),
      },
      submit: evidence.submit !== false, // Submit by default
    });

    return {
      disputeId: dispute.id,
      status: dispute.status,
      evidenceSubmitted: true,
    };
  } catch (error) {
    console.error('Stripe dispute evidence error:', error.message);
    throw new Error(error.message || 'Failed to submit dispute evidence');
  }
};

/**
 * List disputes for the platform or connected account
 *
 * @param {Object} options - List options
 * @param {string} options.connectedAccountId - Connected account ID (optional)
 * @param {number} options.limit - Number of disputes to return
 * @param {string} options.startingAfter - Pagination cursor
 * @returns {Array} List of disputes
 */
const listDisputes = async ({ connectedAccountId, limit = 10, startingAfter } = {}) => {
  try {
    const params = { limit };
    if (startingAfter) params.starting_after = startingAfter;

    const stripeParams = connectedAccountId ? { stripeAccount: connectedAccountId } : {};

    const disputes = await stripe.disputes.list(params, stripeParams);

    return {
      disputes: disputes.data.map(d => ({
        disputeId: d.id,
        chargeId: d.charge,
        amount: d.amount / 100,
        reason: d.reason,
        status: d.status,
        created: new Date(d.created * 1000),
      })),
      hasMore: disputes.has_more,
    };
  } catch (error) {
    console.error('Stripe list disputes error:', error.message);
    throw new Error(error.message || 'Failed to list disputes');
  }
};

// ============================================
// PAYOUTS
// ============================================

/**
 * List payouts for a connected account
 *
 * @param {string} connectedAccountId - Connected account ID
 * @param {Object} options - List options
 * @returns {Array} List of payouts
 */
const listPayouts = async (connectedAccountId, { limit = 10, startingAfter } = {}) => {
  try {
    const params = { limit };
    if (startingAfter) params.starting_after = startingAfter;

    const payouts = await stripe.payouts.list(params, {
      stripeAccount: connectedAccountId,
    });

    return {
      payouts: payouts.data.map(p => ({
        payoutId: p.id,
        amount: p.amount / 100,
        currency: p.currency,
        status: p.status,
        arrivalDate: new Date(p.arrival_date * 1000),
        created: new Date(p.created * 1000),
        method: p.method,
        type: p.type,
        description: p.description,
        failureCode: p.failure_code,
        failureMessage: p.failure_message,
      })),
      hasMore: payouts.has_more,
    };
  } catch (error) {
    console.error('Stripe list payouts error:', error.message);
    throw new Error(error.message || 'Failed to list payouts');
  }
};

/**
 * Retrieve payout details
 *
 * @param {string} payoutId - Stripe Payout ID
 * @param {string} connectedAccountId - Connected account ID
 * @returns {Object} Payout details
 */
const retrievePayout = async (payoutId, connectedAccountId) => {
  try {
    const payout = await stripe.payouts.retrieve(payoutId, {
      stripeAccount: connectedAccountId,
    });

    return {
      payoutId: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency,
      status: payout.status,
      arrivalDate: new Date(payout.arrival_date * 1000),
      created: new Date(payout.created * 1000),
      method: payout.method,
      type: payout.type,
      description: payout.description,
      failureCode: payout.failure_code,
      failureMessage: payout.failure_message,
      bankAccount: payout.destination ? {
        bankName: payout.destination.bank_name,
        last4: payout.destination.last4,
      } : null,
    };
  } catch (error) {
    console.error('Stripe payout retrieval error:', error.message);
    throw new Error(error.message || 'Failed to retrieve payout');
  }
};

/**
 * Get balance for a connected account
 *
 * @param {string} connectedAccountId - Connected account ID
 * @returns {Object} Balance details
 */
const getBalance = async (connectedAccountId) => {
  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: connectedAccountId,
    });

    return {
      available: balance.available.map(b => ({
        amount: b.amount / 100,
        currency: b.currency,
      })),
      pending: balance.pending.map(b => ({
        amount: b.amount / 100,
        currency: b.currency,
      })),
    };
  } catch (error) {
    console.error('Stripe balance error:', error.message);
    throw new Error(error.message || 'Failed to retrieve balance');
  }
};

// ============================================
// INVOICES (Stripe Invoices, not app invoices)
// ============================================

/**
 * Create a Stripe Invoice
 *
 * @param {Object} options - Invoice options
 * @returns {Object} Invoice details
 */
const createStripeInvoice = async ({
  customerId,
  description,
  items, // Array of { description, amount }
  dueDate,
  connectedAccountId,
  applicationFeePercent = 2.5,
  metadata = {},
}) => {
  try {
    const params = connectedAccountId ? { stripeAccount: connectedAccountId } : {};

    // Create invoice items
    for (const item of items) {
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: Math.round(item.amount * 100),
        currency: 'usd',
        description: item.description,
      }, params);
    }

    // Create invoice
    const invoiceParams = {
      customer: customerId,
      description,
      collection_method: 'send_invoice',
      days_until_due: dueDate ? Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 30,
      metadata,
    };

    if (connectedAccountId) {
      invoiceParams.application_fee_amount = Math.round(
        items.reduce((sum, i) => sum + i.amount, 0) * (applicationFeePercent / 100) * 100
      );
    }

    const invoice = await stripe.invoices.create(invoiceParams, params);

    // Finalize and send
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, params);

    return {
      invoiceId: finalizedInvoice.id,
      invoiceNumber: finalizedInvoice.number,
      status: finalizedInvoice.status,
      amountDue: finalizedInvoice.amount_due / 100,
      hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
      invoicePdf: finalizedInvoice.invoice_pdf,
    };
  } catch (error) {
    console.error('Stripe invoice creation error:', error.message);
    throw new Error(error.message || 'Failed to create invoice');
  }
};

module.exports = {
  stripe, // Export raw stripe instance for advanced usage
  getStripeInstance, // Get instance with current credentials
  isConfigured,
  isConfiguredSync,
  getPublishableKey,
  getPublishableKeySync,
  getCredentials,
  clearCredentialsCache,
  // Connect
  createConnectAccount,
  createAccountLink,
  createLoginLink,
  retrieveAccount,
  // Customers & Payment Methods
  createOrRetrieveCustomer,
  attachPaymentMethod,
  listPaymentMethods,
  detachPaymentMethod,
  createSetupIntent,
  // Payments
  createPaymentIntent,
  retrievePaymentIntent,
  // Subscriptions
  createSubscriptionProduct,
  createSubscription,
  cancelSubscription,
  retrieveSubscription,
  updateSubscription,
  // Refunds
  processRefund,
  // Disputes
  retrieveDispute,
  submitDisputeEvidence,
  listDisputes,
  // Payouts
  listPayouts,
  retrievePayout,
  getBalance,
  // Invoices
  createStripeInvoice,
  // Webhooks
  verifyWebhookSignature,
  // Utils
  calculateFees,
};
