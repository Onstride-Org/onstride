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
const stripe = require('../services/stripe');
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


// Create Stripe PaymentIntent for guest invoice (public)
router.post('/guest/:token/stripe/payment-intent', [
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

    // Get barn's Stripe Connect account
    const merchantApp = await MerchantApplication.findOne({ barnId: invoice.barnId });
    const connectedAccountId = merchantApp?.stripeConnect?.accountId;

    if (!stripe.isConfigured()) {
      return res.status(503).json({
        error: 'Payment processing is not available. Please contact the barn directly.'
      });
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.createPaymentIntent({
      invoiceId: invoice._id.toString(),
      amount: invoice.paymentBreakdown.total,
      currency: 'USD',
      connectedAccountId,
      platformFeePercent: invoice.platformFeePercent || 2.5,
      customerEmail: invoice.guestEmail,
      description: `Guest Invoice from ${invoice.barnId}`,
      metadata: {
        guestToken: req.params.token,
        guestEmail: invoice.guestEmail,
        guestName: invoice.guestName,
        barnId: invoice.barnId.toString(),
      },
    });

    // Store PaymentIntent ID on invoice
    invoice.stripePaymentInfo = {
      paymentIntentId: paymentIntent.paymentIntentId,
    };
    await invoice.save();

    return res.json({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
    });
  } catch (error) {
    console.error('Guest Stripe payment intent error:', error.message);
    return res.status(400).json({
      error: error.message || 'Failed to create payment',
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
      }),
      // Hide failed/processing subscription invoices from users - they're internal payment attempts
      $or: [
        { subscriptionTier: { $exists: false } },
        { subscriptionTier: null },
        { status: 'paid' },
        { status: 'pending' }
      ]
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

    // Calculate fees using Stripe fee structure
    const feeBreakdown = stripe.calculateFees(subtotal, method);

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

    // Calculate fees using Stripe fee structure
    const feeBreakdown = stripe.calculateFees(subtotal, method);

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

// Process payment - initiates Stripe payment or records manual payment
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

    const { method } = req.body;

    // For card/ACH payments, create Stripe PaymentIntent
    if (method === 'card' || method === 'ach') {
      if (!stripe.isConfigured()) {
        return res.status(503).json({
          error: 'Payment processing is not configured. Please contact support.'
        });
      }

      // Get barn's Stripe Connect account
      const merchantApp = await MerchantApplication.findOne({ barnId: invoice.barnId });
      const connectedAccountId = merchantApp?.stripeConnect?.accountId;

      // Get barn details for description
      const barn = await Barn.findById(invoice.barnId);

      // Create PaymentIntent
      const paymentIntent = await stripe.createPaymentIntent({
        invoiceId: invoice._id.toString(),
        amount: invoice.paymentBreakdown.total,
        currency: 'USD',
        connectedAccountId,
        platformFeePercent: invoice.platformFeePercent || 2.5,
        customerEmail: invoice.boarderId?.email,
        description: `Invoice from ${barn?.name || 'Barn'}`,
        metadata: {
          boarderId: invoice.boarderId?._id?.toString(),
          barnId: invoice.barnId.toString(),
        },
      });

      invoice.method = method;
      invoice.stripePaymentInfo = {
        paymentIntentId: paymentIntent.paymentIntentId,
      };
      await invoice.save();

      return res.json({
        invoice,
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.paymentIntentId,
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


// Create Stripe PaymentIntent for invoice (authenticated)
router.post('/:id/stripe/payment-intent', [
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

    // Get barn's Stripe Connect account
    const merchantApp = await MerchantApplication.findOne({ barnId: invoice.barnId });
    const connectedAccountId = merchantApp?.stripeConnect?.accountId;

    if (!stripe.isConfigured()) {
      return res.status(503).json({
        error: 'Payment processing is not configured. Please contact support.'
      });
    }

    // Get barn details for description
    const barn = await Barn.findById(invoice.barnId);

    // Create PaymentIntent
    const paymentIntent = await stripe.createPaymentIntent({
      invoiceId: invoice._id.toString(),
      amount: invoice.paymentBreakdown.total,
      currency: 'USD',
      connectedAccountId,
      platformFeePercent: invoice.platformFeePercent || 2.5,
      customerEmail: invoice.boarderId?.email,
      description: `Invoice from ${barn?.name || 'Barn'}`,
      metadata: {
        boarderId: invoice.boarderId?._id?.toString(),
        barnId: invoice.barnId.toString(),
      },
    });

    // Store PaymentIntent ID on invoice
    invoice.stripePaymentInfo = {
      paymentIntentId: paymentIntent.paymentIntentId,
    };
    await invoice.save();

    return res.json({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error.message);
    return res.status(400).json({
      error: error.message || 'Failed to create payment',
    });
  }
});

// Get Stripe payment status for invoice
router.get('/:id/stripe/status', [
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!invoice.stripePaymentInfo?.paymentIntentId) {
      return res.json({ status: invoice.status });
    }

    // Get fresh status from Stripe
    const paymentIntent = await stripe.retrievePaymentIntent(invoice.stripePaymentInfo.paymentIntentId);

    // Update invoice if payment completed (backup for webhook)
    if (paymentIntent.status === 'succeeded' && invoice.status !== 'paid') {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.method = 'card';
      invoice.stripePaymentInfo = {
        ...invoice.stripePaymentInfo,
        chargeId: paymentIntent.chargeId,
        paymentMethodType: paymentIntent.paymentMethodType || 'card',
        last4Digits: paymentIntent.card?.last4,
        brand: paymentIntent.card?.brand,
        receiptUrl: paymentIntent.receiptUrl,
      };
      await invoice.save();
      await updateSubscriptionAfterPayment(invoice);
    }

    res.json({
      status: invoice.status,
      paymentStatus: paymentIntent.status,
      receiptUrl: paymentIntent.receiptUrl,
    });
  } catch (error) {
    next(error);
  }
});

// Get payment status (checks Stripe status)
router.get('/:id/payment-status', [
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check Stripe payment status if available
    if (invoice.stripePaymentInfo?.paymentIntentId) {
      const paymentIntent = await stripe.retrievePaymentIntent(invoice.stripePaymentInfo.paymentIntentId);

      // Update invoice if payment completed (backup for webhook)
      if (paymentIntent.status === 'succeeded' && invoice.status !== 'paid') {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.method = 'card';
        invoice.stripePaymentInfo = {
          ...invoice.stripePaymentInfo,
          chargeId: paymentIntent.chargeId,
          paymentMethodType: paymentIntent.paymentMethodType || 'card',
          last4Digits: paymentIntent.card?.last4,
          brand: paymentIntent.card?.brand,
          receiptUrl: paymentIntent.receiptUrl,
        };
        await invoice.save();
        await updateSubscriptionAfterPayment(invoice);
      }

      return res.json({
        status: invoice.status,
        paymentStatus: paymentIntent.status,
        receiptUrl: paymentIntent.receiptUrl,
      });
    }

    res.json({ status: invoice.status });
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
      paymentInfo: invoice.stripePaymentInfo || invoice.windcavePaymentInfo
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

// Process refund for paid invoice (Stripe only)
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

    // Check if this was a Stripe payment
    if (!invoice.stripePaymentInfo?.paymentIntentId) {
      return res.status(400).json({ error: 'No payment transaction found for refund' });
    }

    const refund = await stripe.processRefund({
      paymentIntentId: invoice.stripePaymentInfo.paymentIntentId,
      amount: req.body.amount, // undefined = full refund
      reason: 'requested_by_customer',
      metadata: {
        invoiceId: invoice._id.toString(),
        refundReason: req.body.reason || 'Refund requested',
      },
    });

    invoice.status = 'refunded';
    invoice.refundInfo = {
      refundId: refund.refundId,
      amount: refund.amount,
      reason: req.body.reason || 'Refund requested',
      refundedAt: new Date(),
      refundedBy: req.userId,
    };
    await invoice.save();

    return res.json({
      message: 'Refund processed successfully',
      invoice,
      refund,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
