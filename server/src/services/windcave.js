/**
 * Windcave Payment Gateway Service
 *
 * Implements Windcave REST API for e-commerce payments
 * Documentation: https://www.windcave.com/developer-e-commerce-api-rest
 *
 * This service supports:
 * - Hosted Payment Page (HPP) - Redirect to Windcave hosted page
 * - Session-based payments
 * - Transaction queries
 * - Refunds
 *
 * Supports both:
 * - Per-barn credentials (stored in MerchantApplication)
 * - Global credentials via environment variables (fallback)
 */

const axios = require('axios');
const crypto = require('crypto');

// Windcave API Configuration
const WINDCAVE_API_URL = process.env.WINDCAVE_API_URL || 'https://sec.windcave.com/api/v1';
const WINDCAVE_API_USER = process.env.WINDCAVE_API_USER;
const WINDCAVE_API_KEY = process.env.WINDCAVE_API_KEY;

/**
 * Create an axios instance with specific credentials
 * @param {Object} credentials - Optional barn-specific credentials { apiKey, apiSecret }
 */
const createApiClient = (credentials = null) => {
  const apiKey = credentials?.apiKey || WINDCAVE_API_USER;
  const apiSecret = credentials?.apiSecret || WINDCAVE_API_KEY;

  return axios.create({
    baseURL: WINDCAVE_API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    auth: {
      username: apiKey || '',
      password: apiSecret || '',
    },
  });
};

// Default axios instance for backward compatibility
const windcaveApi = createApiClient();

/**
 * Check if Windcave is configured (global credentials)
 */
const isConfigured = () => {
  return !!(WINDCAVE_API_USER && WINDCAVE_API_KEY);
};

/**
 * Check if credentials are valid (either passed credentials or global)
 * @param {Object} credentials - Optional barn-specific credentials
 */
const hasValidCredentials = (credentials = null) => {
  if (credentials && credentials.apiKey && credentials.apiSecret) {
    return true;
  }
  return isConfigured();
};

/**
 * Create a payment session for Hosted Payment Page (HPP)
 *
 * @param {Object} options - Payment options
 * @param {string} options.invoiceId - Internal invoice ID
 * @param {number} options.amount - Amount in dollars (will be converted to cents)
 * @param {string} options.currency - Currency code (default: USD)
 * @param {string} options.merchantReference - Unique merchant reference
 * @param {string} options.customerEmail - Customer email for receipt
 * @param {string} options.customerName - Customer name
 * @param {string} options.returnUrl - URL to return after payment
 * @param {string} options.callbackUrl - Webhook URL for payment notifications
 * @param {Object} options.credentials - Optional barn-specific Windcave credentials { apiKey, apiSecret }
 * @returns {Object} Session data with redirect URL
 */
const createPaymentSession = async (options) => {
  const {
    invoiceId,
    amount,
    currency = 'USD',
    merchantReference,
    customerEmail,
    customerName,
    returnUrl,
    callbackUrl,
    credentials,
  } = options;

  if (!hasValidCredentials(credentials)) {
    throw new Error('Windcave is not configured. Please add your Windcave credentials in the Payments settings.');
  }

  // Use barn-specific credentials if provided, otherwise fall back to global
  const apiClient = credentials ? createApiClient(credentials) : windcaveApi;

  // Convert dollars to cents (Windcave uses minor units)
  const amountInCents = Math.round(amount * 100);

  const sessionData = {
    type: 'purchase',
    amount: amountInCents.toString(),
    currency: currency,
    merchantReference: merchantReference || invoiceId,
    callbackUrls: {
      approved: returnUrl + '?status=approved',
      declined: returnUrl + '?status=declined',
      cancelled: returnUrl + '?status=cancelled',
    },
    notificationUrl: callbackUrl,
    methods: ['card'], // Can add 'account2account' for bank transfers
    storeCard: false,
    storedCardIndicator: 'single',
  };

  // Add customer info if provided
  if (customerEmail || customerName) {
    sessionData.customer = {};
    if (customerEmail) sessionData.customer.email = customerEmail;
    if (customerName) sessionData.customer.name = customerName;
  }

  try {
    const response = await apiClient.post('/sessions', sessionData);

    return {
      sessionId: response.data.id,
      state: response.data.state,
      redirectUrl: response.data.links?.find(l => l.rel === 'hpp')?.href,
      ajaxSubmitCardUrl: response.data.links?.find(l => l.rel === 'ajaxSubmitCard')?.href,
      expiresAt: response.data.expires,
      links: response.data.links,
    };
  } catch (error) {
    console.error('Windcave session creation error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to create payment session');
  }
};

/**
 * Create a session specifically for Hosted Fields integration
 * Returns the ajaxSubmitCard URL needed for client-side submission
 *
 * @param {Object} options - Payment options
 * @param {string} options.invoiceId - Internal invoice ID
 * @param {number} options.amount - Amount in dollars
 * @param {string} options.currency - Currency code (default: USD)
 * @param {string} options.merchantReference - Unique merchant reference
 * @param {Object} options.credentials - Optional barn-specific credentials
 * @returns {Object} Session data with ajaxSubmitCard URL for Hosted Fields
 */
const createHostedFieldsSession = async (options) => {
  const {
    invoiceId,
    amount,
    currency = 'USD',
    merchantReference,
    credentials,
  } = options;

  if (!hasValidCredentials(credentials)) {
    throw new Error('Windcave is not configured');
  }

  const apiClient = credentials ? createApiClient(credentials) : windcaveApi;
  const amountInCents = Math.round(amount * 100);

  const sessionData = {
    type: 'purchase',
    amount: amountInCents.toString(),
    currency: currency,
    merchantReference: merchantReference || invoiceId,
    methods: ['card'],
  };

  try {
    const response = await apiClient.post('/sessions', sessionData);

    const ajaxSubmitCardUrl = response.data.links?.find(l => l.rel === 'ajaxSubmitCard')?.href;

    if (!ajaxSubmitCardUrl) {
      throw new Error('Hosted Fields not available for this account. Please contact Windcave support.');
    }

    return {
      sessionId: response.data.id,
      ajaxSubmitCardUrl,
      expiresAt: response.data.expires,
    };
  } catch (error) {
    console.error('Windcave hosted fields session error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to create payment session');
  }
};

/**
 * Query a session to check its status
 *
 * @param {string} sessionId - Windcave session ID
 * @param {Object} credentials - Optional barn-specific credentials
 * @returns {Object} Session status and transaction details
 */
const getSession = async (sessionId, credentials = null) => {
  if (!hasValidCredentials(credentials)) {
    throw new Error('Windcave is not configured');
  }

  const apiClient = credentials ? createApiClient(credentials) : windcaveApi;

  try {
    const response = await apiClient.get(`/sessions/${sessionId}`);

    const session = response.data;
    const transaction = session.transactions?.[0];

    return {
      sessionId: session.id,
      state: session.state,
      merchantReference: session.merchantReference,
      amount: session.amount,
      currency: session.currency,
      transaction: transaction ? {
        id: transaction.id,
        type: transaction.type,
        status: transaction.authorised ? 'approved' : 'declined',
        authorised: transaction.authorised,
        responseCode: transaction.responseCode,
        responseText: transaction.responseText,
        cardNumber: transaction.card?.cardNumber, // Masked card number
        cardType: transaction.card?.cardType,
        cardExpiry: transaction.card?.dateExpiryMonth && transaction.card?.dateExpiryYear
          ? `${transaction.card.dateExpiryMonth}/${transaction.card.dateExpiryYear}`
          : null,
        rrn: transaction.rrn, // Retrieval Reference Number
      } : null,
    };
  } catch (error) {
    console.error('Windcave get session error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to get session status');
  }
};

/**
 * Query a transaction directly
 *
 * @param {string} transactionId - Windcave transaction ID
 * @param {Object} credentials - Optional barn-specific credentials
 * @returns {Object} Transaction details
 */
const getTransaction = async (transactionId, credentials = null) => {
  if (!hasValidCredentials(credentials)) {
    throw new Error('Windcave is not configured');
  }

  const apiClient = credentials ? createApiClient(credentials) : windcaveApi;

  try {
    const response = await apiClient.get(`/transactions/${transactionId}`);
    const tx = response.data;

    return {
      id: tx.id,
      type: tx.type,
      status: tx.authorised ? 'approved' : 'declined',
      authorised: tx.authorised,
      amount: tx.amount,
      currency: tx.currency,
      merchantReference: tx.merchantReference,
      responseCode: tx.responseCode,
      responseText: tx.responseText,
      card: tx.card ? {
        number: tx.card.cardNumber,
        type: tx.card.cardType,
        expiry: `${tx.card.dateExpiryMonth}/${tx.card.dateExpiryYear}`,
      } : null,
      rrn: tx.rrn,
      createdAt: tx.dateTimeUtc,
    };
  } catch (error) {
    console.error('Windcave get transaction error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to get transaction');
  }
};

/**
 * Process a refund
 *
 * @param {string} originalTransactionId - Original transaction ID to refund
 * @param {number} amount - Amount to refund in dollars (will be converted to cents)
 * @param {string} merchantReference - Reference for the refund
 * @param {Object} credentials - Optional barn-specific credentials
 * @returns {Object} Refund transaction details
 */
const processRefund = async (originalTransactionId, amount, merchantReference, credentials = null) => {
  if (!hasValidCredentials(credentials)) {
    throw new Error('Windcave is not configured');
  }

  const apiClient = credentials ? createApiClient(credentials) : windcaveApi;
  const amountInCents = Math.round(amount * 100);

  try {
    const response = await apiClient.post('/transactions', {
      type: 'refund',
      amount: amountInCents.toString(),
      originalTransactionId: originalTransactionId,
      merchantReference: merchantReference,
    });

    const tx = response.data;
    return {
      id: tx.id,
      type: tx.type,
      status: tx.authorised ? 'approved' : 'declined',
      authorised: tx.authorised,
      amount: tx.amount,
      responseCode: tx.responseCode,
      responseText: tx.responseText,
    };
  } catch (error) {
    console.error('Windcave refund error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to process refund');
  }
};

/**
 * Verify webhook/callback signature from Windcave
 * Note: Windcave uses HMAC-SHA256 for webhook verification
 *
 * @param {string} payload - Raw request body
 * @param {string} signature - Signature from X-Windcave-Signature header
 * @param {string} secret - Webhook secret from Windcave dashboard
 * @returns {boolean} Whether signature is valid
 */
const verifyWebhookSignature = (payload, signature, secret) => {
  if (!secret) {
    console.warn('Windcave webhook secret not configured, skipping verification');
    return true; // Skip verification if not configured
  }

  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
};

/**
 * Calculate Windcave processing fees
 * Note: These are estimates - actual fees depend on your Windcave agreement
 *
 * @param {number} amount - Transaction amount in dollars
 * @returns {Object} Fee breakdown
 */
const calculateFees = (amount) => {
  // Default fee structure (adjust based on your Windcave agreement)
  // Typical: 2.9% + $0.30 per transaction (similar to Stripe)
  const percentFee = 0.029; // 2.9%
  const fixedFee = 0.30; // $0.30

  const processingFee = (amount * percentFee) + fixedFee;
  const platformFee = amount * 0.025; // 2.5% platform fee

  return {
    subtotal: amount,
    processingFee: Math.round(processingFee * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    total: Math.round((amount + processingFee + platformFee) * 100) / 100,
  };
};

/**
 * Parse Windcave notification/callback data
 *
 * @param {Object} data - Notification data from Windcave
 * @returns {Object} Parsed notification
 */
const parseNotification = (data) => {
  return {
    sessionId: data.sessionId,
    transactionId: data.transactionId,
    merchantReference: data.merchantReference,
    type: data.type,
    status: data.authorised ? 'approved' : 'declined',
    authorised: data.authorised,
    amount: data.amount ? parseInt(data.amount) / 100 : null, // Convert from cents
    currency: data.currency,
    responseCode: data.responseCode,
    responseText: data.responseText,
    card: data.card ? {
      number: data.card.cardNumber,
      type: data.card.cardType,
    } : null,
  };
};

/**
 * Process a direct card payment (card details submitted directly)
 * This creates a session and immediately completes it with card details
 *
 * @param {Object} options - Payment options
 * @param {number} options.amount - Amount in dollars
 * @param {string} options.currency - Currency code (default: USD)
 * @param {string} options.merchantReference - Unique reference
 * @param {string} options.cardNumber - Card number (no spaces)
 * @param {string} options.expiryMonth - MM format
 * @param {string} options.expiryYear - YYYY format
 * @param {string} options.cvv - CVV/CVC
 * @param {string} options.cardholderName - Name on card
 * @param {Object} options.credentials - Optional barn-specific credentials
 * @returns {Object} Transaction result
 */
const processDirectPayment = async (options) => {
  const {
    amount,
    currency = 'USD',
    merchantReference,
    cardNumber,
    expiryMonth,
    expiryYear,
    cvv,
    cardholderName,
    credentials,
  } = options;

  if (!hasValidCredentials(credentials)) {
    throw new Error('Windcave is not configured');
  }

  const apiClient = credentials ? createApiClient(credentials) : windcaveApi;
  const amountInCents = Math.round(amount * 100);

  try {
    // Create a session with card details included for immediate processing
    const sessionData = {
      type: 'purchase',
      amount: amountInCents.toString(),
      currency: currency,
      merchantReference: merchantReference,
      methods: ['card'],
      card: {
        cardNumber: cardNumber,
        dateExpiryMonth: expiryMonth,
        dateExpiryYear: expiryYear.slice(-2), // Windcave expects YY format
        cvc2: cvv,
        cardHolderName: cardholderName,
      },
    };

    const response = await apiClient.post('/sessions', sessionData);

    // Check if the transaction was processed
    const session = response.data;
    const transaction = session.transactions?.[0];

    if (transaction) {
      return {
        sessionId: session.id,
        transactionId: transaction.id,
        authorised: transaction.authorised,
        status: transaction.authorised ? 'approved' : 'declined',
        responseCode: transaction.responseCode,
        responseText: transaction.responseText,
        cardNumber: transaction.card?.cardNumber, // Masked
        cardType: transaction.card?.cardType,
        rrn: transaction.rrn,
      };
    }

    // If no transaction yet, the session needs to be completed
    // This happens when additional authentication (3DS) is required
    return {
      sessionId: session.id,
      state: session.state,
      requires3DS: session.state === '3ds' || session.state === 'challenge',
      links: session.links,
    };
  } catch (error) {
    console.error('Windcave direct payment error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.errors?.[0]?.message || 'Payment failed';
    throw new Error(errorMessage);
  }
};

module.exports = {
  isConfigured,
  hasValidCredentials,
  createPaymentSession,
  createHostedFieldsSession,
  processDirectPayment,
  getSession,
  getTransaction,
  processRefund,
  verifyWebhookSignature,
  calculateFees,
  parseNotification,
};
