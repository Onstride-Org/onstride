const { BarnSubscription } = require('../models/Subscription');
const express = require('express');
const crypto = require('crypto');
const { body, param, query } = require('express-validator');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Barn = require('../models/Barn');
const MerchantApplication = require('../models/MerchantApplication');
const { authenticate, loadBarnContext, requireBarn, hasPermission, ownsResourceOrStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');
const windcave = require('../services/windcave');
const emailService = require('../services/email');
const { updateSubscriptionAfterPayment } = require('../services/subscriptions');

// Simple date formatter
const formatDate = (date) => {
  const d = new Date(date);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

// Generate secure token for guest invoices
const generateGuestToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const router = express.Router();

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

// Get guest invoice by token (public)
router.get('/guest/:token', [
  param('token').isLength({ min: 64, max: 64 }),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      guestToken: req.params.token,
      isGuestInvoice: true,
      deletedAt: null
    }).populate('horseId', 'name').populate('barnId', 'name');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or link has expired' });
    }

    // Check if token has expired (30 days)
    if (invoice.guestTokenExpiresAt && new Date() > invoice.guestTokenExpiresAt) {
      return res.status(410).json({ error: 'This invoice link has expired' });
    }

    // Return invoice data for guest view
    res.json({
      id: invoice._id,
      barnName: invoice.barnId?.name || 'Unknown Barn',
      guestName: invoice.guestName,
      guestEmail: invoice.guestEmail,
      horse: invoice.horseId?.name,
      charges: invoice.charges,
      dueDate: invoice.dueDate,
      status: invoice.status,
      paymentBreakdown: invoice.paymentBreakdown,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      paidAt: invoice.paidAt
    });
  } catch (error) {
    next(error);
  }
});

// Create Hosted Fields session for guest invoice (public)
router.post('/guest/:token/hosted-fields-session', [
  param('token').isLength({ min: 64, max: 64 }),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      guestToken: req.params.token,
      isGuestInvoice: true,
      deletedAt: null
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.guestTokenExpiresAt && new Date() > invoice.guestTokenExpiresAt) {
      return res.status(410).json({ error: 'This invoice link has expired' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    // Get barn-specific Windcave credentials
    const merchantApp = await MerchantApplication.findOne({ barnId: invoice.barnId })
      .select('+windcaveCredentials.apiKeyEncrypted +windcaveCredentials.apiSecretEncrypted');

    let credentials = null;
    if (merchantApp?.windcaveCredentials?.isActive) {
      credentials = merchantApp.getWindcaveCredentials();
    }

    if (!windcave.hasValidCredentials(credentials)) {
      return res.status(503).json({
        error: 'Payment processing is not available. Please contact the barn directly.'
      });
    }

    // Create Hosted Fields session
    const session = await windcave.createHostedFieldsSession({
      invoiceId: invoice._id.toString(),
      amount: invoice.paymentBreakdown.total,
      currency: 'USD',
      merchantReference: `GUEST-INV-${invoice._id}`,
      credentials,
    });

    // Store session ID on invoice
    invoice.windcavePaymentInfo = {
      sessionId: session.sessionId,
    };
    await invoice.save();

    return res.json({
      sessionId: session.sessionId,
      ajaxSubmitCardUrl: session.ajaxSubmitCardUrl,
    });
  } catch (error) {
    console.error('Guest hosted fields session error:', error.message);
    return res.status(400).json({
      error: error.message || 'Failed to create payment session',
    });
  }
});

// Pay guest invoice (public) - DEPRECATED: Use hosted-fields-session + client-side submission
router.post('/guest/:token/pay', [
  param('token').isLength({ min: 64, max: 64 }),
  body('cardNumber').notEmpty().isLength({ min: 13, max: 19 }),
  body('expiryMonth').notEmpty().isLength({ min: 2, max: 2 }),
  body('expiryYear').notEmpty().isLength({ min: 4, max: 4 }),
  body('cvv').notEmpty().isLength({ min: 3, max: 4 }),
  body('cardholderName').notEmpty().trim(),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      guestToken: req.params.token,
      isGuestInvoice: true,
      deletedAt: null
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.guestTokenExpiresAt && new Date() > invoice.guestTokenExpiresAt) {
      return res.status(410).json({ error: 'This invoice link has expired' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    // Get barn-specific Windcave credentials
    const merchantApp = await MerchantApplication.findOne({ barnId: invoice.barnId })
      .select('+windcaveCredentials.apiKeyEncrypted +windcaveCredentials.apiSecretEncrypted');

    let credentials = null;
    if (merchantApp?.windcaveCredentials?.isActive) {
      credentials = merchantApp.getWindcaveCredentials();
    }

    if (!windcave.hasValidCredentials(credentials)) {
      return res.status(503).json({
        error: 'Payment processing is not available. Please contact the barn directly.'
      });
    }

    const { cardNumber, expiryMonth, expiryYear, cvv, cardholderName } = req.body;

    const result = await windcave.processDirectPayment({
      amount: invoice.paymentBreakdown.total,
      currency: 'USD',
      merchantReference: `GUEST-INV-${invoice._id}`,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cardholderName,
      credentials,
    });

    if (result.authorised) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.method = 'card';
      invoice.windcavePaymentInfo = {
        sessionId: result.sessionId,
        transactionId: result.transactionId,
        cardNumber: result.cardNumber,
        cardType: result.cardType,
        responseCode: result.responseCode,
        responseText: result.responseText,
        rrn: result.rrn,
      };
      await invoice.save();
      await updateSubscriptionAfterPayment(invoice);
      await updateSubscriptionAfterPayment(invoice);

      return res.json({
        status: 'paid',
        authorised: true,
        message: 'Payment successful',
      });
    } else if (result.requires3DS) {
      const hppLink = result.links?.find(l => l.rel === 'hpp' || l.rel === 'redirect');
      return res.json({
        status: 'requires_action',
        requires3DS: true,
        redirectUrl: hppLink?.href,
        sessionId: result.sessionId,
      });
    } else {
      invoice.status = 'failed';
      invoice.failureReason = result.responseText || 'Payment declined';
      await invoice.save();

      return res.status(400).json({
        status: 'failed',
        authorised: false,
        responseText: result.responseText || 'Payment was declined',
      });
    }
  } catch (error) {
    console.error('Guest payment error:', error.message);
    return res.status(400).json({
      error: error.message || 'Payment failed',
    });
  }
});

// ============================================
// AUTHENTICATED ROUTES
// ============================================
router.use(authenticate);
router.use(loadBarnContext);

// Get all invoices
router.get('/', requireBarn, async (req, res, next) => {
  try {
    const { status, boarderId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const user = req.user;

    // Boarders can only see their own invoices
    const isBoarder = user.accountType === 'boarder' ||
      (req.barnRole && req.barnRole.role === 'boarder');

    const filter = {
      barnId: req.barnId,
      ...(status && { status }),
      ...(isBoarder ? { boarderId: req.userId } : (boarderId && { boarderId })),
      ...(startDate && endDate && {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      })
    };

    const invoices = await Invoice.find(filter)
      .populate('boarderId', 'name email')
      .populate('horseId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get invoice by ID
router.get('/:id', [
  ownsResourceOrStaff(async (req) => {
    const invoice = await Invoice.findById(req.params.id);
    return invoice?.boarderId;
  })
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('boarderId', 'name email avatarUrl')
      .populate('horseId', 'name')
      .populate('createdById', 'name');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

// Create invoice
router.post('/', [
  requireBarn,
  hasPermission('generateInvoices'),
  body('boarderId').isMongoId(),
  body('dueDate').isISO8601(),
  body('charges').isArray({ min: 1 }),
  body('method').optional().isIn(['card', 'credit', 'debit', 'ach', 'cash', 'check', 'other']),
  body('subscriptionTier').optional().isIn(['free', 'starter', 'business', 'business_pro', 'enterprise', 'founders']),
  body('subscriptionInterval').optional().isIn(['monthly', 'yearly']),
  validate
], async (req, res, next) => {
  try {
    const { boarderId, horseId, dueDate, charges, notes, method, subscriptionTier, subscriptionInterval } = req.body;

    // Calculate subtotal
    const subtotal = charges.reduce((sum, c) => sum + (c.amount * (c.quantity || 1)), 0);

    // Calculate fees using Windcave fee structure
    const feeBreakdown = windcave.calculateFees(subtotal, method);

    const invoice = await Invoice.create({
      barnId: req.barnId,
      boarderId,
      horseId,
      createdById: req.userId,
      dueDate,
      charges,
      notes,
      platformFeePercent: 2.5,
      method,
      ...(subscriptionTier && { subscriptionTier }),
      ...(subscriptionInterval && { subscriptionInterval }),
      paymentBreakdown: {
        subtotal: feeBreakdown.subtotal,
        processingFee: feeBreakdown.processingFee,
        platformFee: feeBreakdown.platformFee,
        total: feeBreakdown.total  // Customer pays subtotal + processing fee
      }
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('boarderId', 'name email')
      .populate('horseId', 'name');

    // Send email notification to boarder
    if (populated.boarderId?.email) {
      try {
        const barn = await Barn.findById(req.barnId);
        await emailService.sendInvoiceEmail({
          to: populated.boarderId.email,
          name: populated.boarderId.name,
          barnName: barn?.name || 'Your Barn',
          invoiceId: populated._id.toString(),
          amount: feeBreakdown.total,
          dueDate: formatDate(dueDate)
        });
      } catch (emailError) {
        console.error('Failed to send invoice email:', emailError.message);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// Create guest invoice (for non-OnStride users)
router.post('/guest', [
  requireBarn,
  hasPermission('generateInvoices'),
  body('guestEmail').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  body('guestName').notEmpty().trim(),
  body('dueDate').isISO8601(),
  body('charges').isArray({ min: 1 }),
  body('method').optional().isIn(['card', 'credit', 'debit', 'ach', 'cash', 'check', 'other']),
  body('subscriptionTier').optional().isIn(['free', 'starter', 'business', 'business_pro', 'enterprise', 'founders']),
  body('subscriptionInterval').optional().isIn(['monthly', 'yearly']),
  validate
], async (req, res, next) => {
  try {
    const { guestEmail, guestName, horseId, dueDate, charges, notes, method, subscriptionTier, subscriptionInterval } = req.body;

    // Calculate subtotal
    const subtotal = charges.reduce((sum, c) => sum + (c.amount * (c.quantity || 1)), 0);

    // Calculate fees using Windcave fee structure
    const feeBreakdown = windcave.calculateFees(subtotal, method);

    // Generate secure token for guest access (valid for 30 days)
    const guestToken = generateGuestToken();
    const guestTokenExpiresAt = new Date();
    guestTokenExpiresAt.setDate(guestTokenExpiresAt.getDate() + 30);

    const invoice = await Invoice.create({
      barnId: req.barnId,
      isGuestInvoice: true,
      guestEmail,
      guestName,
      guestToken,
      guestTokenExpiresAt,
      horseId,
      createdById: req.userId,
      dueDate,
      charges,
      notes,
      platformFeePercent: 2.5,
      method,
      ...(subscriptionTier && { subscriptionTier }),
      ...(subscriptionInterval && { subscriptionInterval }),
      paymentBreakdown: {
        subtotal: feeBreakdown.subtotal,
        processingFee: feeBreakdown.processingFee,
        platformFee: feeBreakdown.platformFee,
        total: feeBreakdown.total  // Customer pays subtotal + processing fee
      }
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('horseId', 'name');

    // Send email to guest with payment link
    try {
      const barn = await Barn.findById(req.barnId);
      await emailService.sendGuestInvoiceEmail({
        to: guestEmail,
        name: guestName,
        barnName: barn?.name || 'Your Barn',
        invoiceId: invoice._id.toString(),
        guestToken,
        amount: feeBreakdown.total,
        dueDate: formatDate(dueDate)
      });
    } catch (emailError) {
      console.error('Failed to send guest invoice email:', emailError.message);
    }

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// Update invoice
router.put('/:id', [
  hasPermission('generateInvoices'),
  param('id').isMongoId(),
  body('method').optional().isIn(['card', 'credit', 'debit', 'ach', 'cash', 'check', 'other']),
  body('subscriptionTier').optional().isIn(['free', 'starter', 'business', 'business_pro', 'enterprise', 'founders']),
  body('subscriptionInterval').optional().isIn(['monthly', 'yearly']),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Cannot edit paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Cannot edit paid invoice' });
    }

    const { charges, dueDate, notes, method, subscriptionTier, subscriptionInterval } = req.body;

    if (charges) {
      invoice.charges = charges;
      // Recalculate
      const subtotal = charges.reduce((sum, c) => sum + (c.amount * (c.quantity || 1)), 0);
      const feeBreakdown = windcave.calculateFees(subtotal, method || invoice.method);
      invoice.paymentBreakdown = {
        subtotal: feeBreakdown.subtotal,
        processingFee: feeBreakdown.processingFee,
        platformFee: feeBreakdown.platformFee,
        total: feeBreakdown.total  // Customer pays subtotal + processing fee
      };
    }

    if (dueDate) invoice.dueDate = dueDate;
    if (notes !== undefined) invoice.notes = notes;
    if (method) invoice.method = method;
    if (subscriptionTier !== undefined) invoice.subscriptionTier = subscriptionTier;
    if (subscriptionInterval !== undefined) invoice.subscriptionInterval = subscriptionInterval;

    await invoice.save();

    const populated = await Invoice.findById(invoice._id)
      .populate('boarderId', 'name email')
      .populate('horseId', 'name');

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// Process payment - initiates Windcave payment session
router.post('/:id/payment', [
  param('id').isMongoId(),
  body('method').isIn(['card', 'ach', 'cash', 'check', 'other']),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('boarderId', 'name email');
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check ownership or staff
    const isOwner = invoice.boarderId._id.toString() === req.userId.toString();
    const isStaff = ['owner', 'admin', 'manager'].includes(req.user.accountType) ||
      (req.barnRole && ['owner', 'admin', 'manager'].includes(req.barnRole.role));

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { method, returnUrl } = req.body;

    // For card payments, create Windcave payment session
    if (method === 'card') {
      // Get barn-specific Windcave credentials
      const merchantApp = await MerchantApplication.findOne({ barnId: invoice.barnId })
        .select('+windcaveCredentials.apiKeyEncrypted +windcaveCredentials.apiSecretEncrypted');

      let credentials = null;

      if (merchantApp?.windcaveCredentials?.isActive) {
        // Use barn-specific credentials
        credentials = merchantApp.getWindcaveCredentials();
      }

      // Check if we have valid credentials (barn-specific or global fallback)
      if (!windcave.hasValidCredentials(credentials)) {
        return res.status(503).json({
          error: 'Payment processing is not configured. Please add your Windcave credentials in the Payments settings.'
        });
      }

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const callbackUrl = process.env.API_URL
        ? `${process.env.API_URL}/api/invoices/windcave-callback`
        : 'http://localhost:3000/api/invoices/windcave-callback';

      const session = await windcave.createPaymentSession({
        invoiceId: invoice._id.toString(),
        amount: invoice.paymentBreakdown.total,
        currency: 'USD',
        merchantReference: `INV-${invoice._id}`,
        customerEmail: invoice.boarderId?.email,
        customerName: invoice.boarderId?.name,
        returnUrl: returnUrl || `${baseUrl}/app/invoices/${invoice._id}`,
        callbackUrl,
        credentials,
      });

      invoice.status = 'processing';
      invoice.method = method;
      invoice.windcavePaymentInfo = {
        sessionId: session.sessionId,
      };
      await invoice.save();

      return res.json({
        invoice,
        paymentSession: {
          sessionId: session.sessionId,
          redirectUrl: session.redirectUrl,
          expiresAt: session.expiresAt,
        },
      });
    } else {
      // Cash/check - mark as paid directly (staff only)
      if (!isStaff) {
        return res.status(403).json({ error: 'Only staff can record manual payments' });
      }
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.method = method;
      await invoice.save();

      return res.json({ invoice });
    }
  } catch (error) {
    next(error);
  }
});

// Create Hosted Fields session for embedded payment
router.post('/:id/hosted-fields-session', [
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('boarderId', 'name email');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check ownership or staff
    const isOwner = invoice.boarderId?._id?.toString() === req.userId?.toString();
    const isStaff = ['owner', 'admin', 'manager'].includes(req.user.accountType) ||
      (req.barnRole && ['owner', 'admin', 'manager'].includes(req.barnRole.role));

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    // Get barn-specific Windcave credentials
    const merchantApp = await MerchantApplication.findOne({ barnId: invoice.barnId })
      .select('+windcaveCredentials.apiKeyEncrypted +windcaveCredentials.apiSecretEncrypted');

    let credentials = null;
    if (merchantApp?.windcaveCredentials?.isActive) {
      credentials = merchantApp.getWindcaveCredentials();
    }

    if (!windcave.hasValidCredentials(credentials)) {
      return res.status(503).json({
        error: 'Payment processing is not configured. Please contact support.'
      });
    }

    // Create Hosted Fields session
    const session = await windcave.createHostedFieldsSession({
      invoiceId: invoice._id.toString(),
      amount: invoice.paymentBreakdown.total,
      currency: 'USD',
      merchantReference: `INV-${invoice._id}`,
      credentials,
    });

    // Store session ID on invoice
    invoice.windcavePaymentInfo = {
      sessionId: session.sessionId,
    };
    await invoice.save();

    return res.json({
      sessionId: session.sessionId,
      ajaxSubmitCardUrl: session.ajaxSubmitCardUrl,
    });
  } catch (error) {
    console.error('Hosted fields session error:', error.message);
    return res.status(400).json({
      error: error.message || 'Failed to create payment session',
    });
  }
});

// Process direct card payment (embedded form - no redirect)
router.post('/:id/pay-direct', [
  param('id').isMongoId(),
  body('cardNumber').notEmpty().isLength({ min: 13, max: 19 }),
  body('expiryMonth').notEmpty().isLength({ min: 2, max: 2 }),
  body('expiryYear').notEmpty().isLength({ min: 4, max: 4 }),
  body('cvv').notEmpty().isLength({ min: 3, max: 4 }),
  body('cardholderName').notEmpty().trim(),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('boarderId', 'name email');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check ownership or staff
    const isOwner = invoice.boarderId._id.toString() === req.userId.toString();
    const isStaff = ['owner', 'admin', 'manager'].includes(req.user.accountType) ||
      (req.barnRole && ['owner', 'admin', 'manager'].includes(req.barnRole.role));

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    // Get barn-specific Windcave credentials
    const merchantApp = await MerchantApplication.findOne({ barnId: invoice.barnId })
      .select('+windcaveCredentials.apiKeyEncrypted +windcaveCredentials.apiSecretEncrypted');

    let credentials = null;
    if (merchantApp?.windcaveCredentials?.isActive) {
      credentials = merchantApp.getWindcaveCredentials();
    }

    if (!windcave.hasValidCredentials(credentials)) {
      return res.status(503).json({
        error: 'Payment processing is not configured. Please contact support.'
      });
    }

    const { cardNumber, expiryMonth, expiryYear, cvv, cardholderName } = req.body;

    // Process the payment directly
    const result = await windcave.processDirectPayment({
      amount: invoice.paymentBreakdown.total,
      currency: 'USD',
      merchantReference: `INV-${invoice._id}`,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cardholderName,
      credentials,
    });

    if (result.authorised) {
      // Payment successful
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.method = 'card';
      invoice.windcavePaymentInfo = {
        sessionId: result.sessionId,
        transactionId: result.transactionId,
        cardNumber: result.cardNumber,
        cardType: result.cardType,
        responseCode: result.responseCode,
        responseText: result.responseText,
        rrn: result.rrn,
      };
      await invoice.save();
      await updateSubscriptionAfterPayment(invoice);

      return res.json({
        status: 'paid',
        authorised: true,
        transactionId: result.transactionId,
        message: 'Payment successful',
      });
    } else if (result.requires3DS) {
      // 3D Secure required - return the redirect URL
      const hppLink = result.links?.find(l => l.rel === 'hpp' || l.rel === 'redirect');
      return res.json({
        status: 'requires_action',
        requires3DS: true,
        redirectUrl: hppLink?.href,
        sessionId: result.sessionId,
      });
    } else {
      // Payment declined
      invoice.status = 'failed';
      invoice.failureReason = result.responseText || 'Payment declined';
      await invoice.save();

      return res.status(400).json({
        status: 'failed',
        authorised: false,
        responseText: result.responseText || 'Payment was declined',
      });
    }
  } catch (error) {
    console.error('Direct payment error:', error.message);
    return res.status(400).json({
      error: error.message || 'Payment failed',
    });
  }
});

// Check Windcave payment session status
router.get('/:id/payment-status', [
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!invoice.windcavePaymentInfo?.sessionId) {
      return res.json({ status: invoice.status });
    }

    // Get barn-specific Windcave credentials
    const merchantApp = await MerchantApplication.findOne({ barnId: invoice.barnId })
      .select('+windcaveCredentials.apiKeyEncrypted +windcaveCredentials.apiSecretEncrypted');

    let credentials = null;
    if (merchantApp?.windcaveCredentials?.isActive) {
      credentials = merchantApp.getWindcaveCredentials();
    }

    // Query Windcave for latest session status
    const session = await windcave.getSession(invoice.windcavePaymentInfo.sessionId, credentials);

    // Update invoice if payment completed
    if (session.transaction?.authorised && invoice.status !== 'paid') {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.windcavePaymentInfo = {
        ...invoice.windcavePaymentInfo,
        transactionId: session.transaction.id,
        rrn: session.transaction.rrn,
        cardNumber: session.transaction.cardNumber,
        cardType: session.transaction.cardType,
        responseCode: session.transaction.responseCode,
        responseText: session.transaction.responseText,
      };
      await invoice.save();
    } else if (session.transaction && !session.transaction.authorised && invoice.status === 'processing') {
      invoice.status = 'failed';
      invoice.failureReason = session.transaction.responseText;
      await invoice.save();
    }

    res.json({
      status: invoice.status,
      sessionState: session.state,
      transaction: session.transaction,
    });
  } catch (error) {
    next(error);
  }
});

// Get receipt
router.get('/:id/receipt', async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('boarderId', 'name email')
      .populate('horseId', 'name')
      .populate('createdById', 'name');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'paid') {
      return res.status(400).json({ error: 'Invoice not paid' });
    }

    // Generate receipt data
    const receipt = {
      invoiceId: invoice._id,
      paidAt: invoice.paidAt,
      method: invoice.method,
      boarder: {
        name: invoice.boarderId?.name,
        email: invoice.boarderId?.email
      },
      horse: invoice.horseId?.name,
      charges: invoice.charges,
      paymentBreakdown: invoice.paymentBreakdown,
      paymentInfo: invoice.stripePaymentInfo
    };

    res.json(receipt);
  } catch (error) {
    next(error);
  }
});

// Cancel invoice
router.post('/:id/cancel', [
  hasPermission('generateInvoices'),
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Cannot cancel paid invoice' });
    }

    invoice.status = 'cancelled';
    await invoice.save();

    res.json({ message: 'Invoice cancelled' });
  } catch (error) {
    next(error);
  }
});

// Delete invoice (soft delete)
router.delete('/:id', [
  hasPermission('generateInvoices'),
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Cannot delete paid invoice' });
    }

    invoice.deletedAt = new Date();
    invoice.deletedBy = req.userId;
    await invoice.save();

    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    next(error);
  }
});

// Windcave callback/webhook (public route - no auth)
// This endpoint receives notifications when payment status changes
router.post('/windcave-callback', express.json(), async (req, res, next) => {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-windcave-signature'];
    const webhookSecret = process.env.WINDCAVE_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = windcave.verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid Windcave webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Parse the notification
    const notification = windcave.parseNotification(req.body);
    console.log('Windcave callback received:', notification);

    // Find invoice by session ID or merchant reference
    let invoice;
    if (notification.sessionId) {
      invoice = await Invoice.findOne({
        'windcavePaymentInfo.sessionId': notification.sessionId
      });
    }
    if (!invoice && notification.merchantReference) {
      // merchantReference format: INV-{invoiceId}
      const invoiceId = notification.merchantReference.replace('INV-', '');
      invoice = await Invoice.findById(invoiceId);
    }

    if (!invoice) {
      console.error('Invoice not found for Windcave callback:', notification);
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update invoice based on payment status
    if (notification.authorised) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.windcavePaymentInfo = {
        ...invoice.windcavePaymentInfo?.toObject?.() || invoice.windcavePaymentInfo || {},
        transactionId: notification.transactionId,
        cardNumber: notification.card?.number,
        cardType: notification.card?.type,
        responseCode: notification.responseCode,
        responseText: notification.responseText,
      };
      await updateSubscriptionAfterPayment(invoice);
    } else {
      invoice.status = 'failed';
      invoice.failureReason = notification.responseText || 'Payment declined';
    }

    await invoice.save();
    console.log(`Invoice ${invoice._id} updated to status: ${invoice.status}`);

    res.json({ received: true });
  } catch (error) {
    console.error('Windcave callback error:', error);
    next(error);
  }
});

// Process refund for paid invoice
router.post('/:id/refund', [
  hasPermission('generateInvoices'),
  param('id').isMongoId(),
  body('amount').optional().isNumeric(),
  body('reason').optional().isString(),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'paid') {
      return res.status(400).json({ error: 'Can only refund paid invoices' });
    }

    if (!invoice.windcavePaymentInfo?.transactionId) {
      return res.status(400).json({ error: 'No payment transaction found for refund' });
    }

    // Get barn-specific Windcave credentials
    const merchantApp = await MerchantApplication.findOne({ barnId: invoice.barnId })
      .select('+windcaveCredentials.apiKeyEncrypted +windcaveCredentials.apiSecretEncrypted');

    let credentials = null;
    if (merchantApp?.windcaveCredentials?.isActive) {
      credentials = merchantApp.getWindcaveCredentials();
    }

    const refundAmount = req.body.amount || invoice.paymentBreakdown.total;
    const merchantReference = `REFUND-INV-${invoice._id}`;
    const metaData = [invoice._id.toString(), merchantReference];

    const refund = await windcave.processRefund(
      invoice.windcavePaymentInfo.transactionId,
      refundAmount,
      merchantReference,
      credentials,
      metaData
    );

    if (refund.authorised) {
      invoice.status = 'refunded';
      invoice.refundInfo = {
        transactionId: refund.id,
        amount: refundAmount,
        reason: req.body.reason || 'Refund requested',
        refundedAt: new Date(),
        refundedBy: req.userId,
      };
      await invoice.save();

      res.json({
        message: 'Refund processed successfully',
        invoice,
        refund,
      });
    } else {
      res.status(400).json({
        error: 'Refund failed',
        reason: refund.responseText,
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
