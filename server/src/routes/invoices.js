const express = require('express');
const { body, param } = require('express-validator');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Barn = require('../models/Barn');
const { authenticate, loadBarnContext, requireBarn, hasPermission, ownsResourceOrStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');
const windcave = require('../services/windcave');
const emailService = require('../services/email');

// Simple date formatter
const formatDate = (date) => {
  const d = new Date(date);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const router = express.Router();

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
  validate
], async (req, res, next) => {
  try {
    const { boarderId, horseId, dueDate, charges, notes } = req.body;

    // Calculate subtotal
    const subtotal = charges.reduce((sum, c) => sum + (c.amount * (c.quantity || 1)), 0);

    // Calculate fees using Windcave fee structure
    const feeBreakdown = windcave.calculateFees(subtotal);

    const invoice = await Invoice.create({
      barnId: req.barnId,
      boarderId,
      horseId,
      createdById: req.userId,
      dueDate,
      charges,
      notes,
      platformFeePercent: 2.5,
      paymentBreakdown: {
        subtotal: feeBreakdown.subtotal,
        processingFee: feeBreakdown.processingFee,
        platformFee: feeBreakdown.platformFee,
        total: subtotal  // Customer pays subtotal only, fees come out of barn's share
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
          amount: subtotal,
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

// Update invoice
router.put('/:id', [
  hasPermission('generateInvoices'),
  param('id').isMongoId(),
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

    const { charges, dueDate, notes } = req.body;

    if (charges) {
      invoice.charges = charges;
      // Recalculate
      const subtotal = charges.reduce((sum, c) => sum + (c.amount * (c.quantity || 1)), 0);
      const platformFee = subtotal * (invoice.platformFeePercent / 100);
      const stripeFee = (subtotal * 0.029) + 0.30;
      invoice.paymentBreakdown = {
        subtotal,
        stripeFee,
        platformFee,
        total: subtotal
      };
    }

    if (dueDate) invoice.dueDate = dueDate;
    if (notes !== undefined) invoice.notes = notes;

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
      // Check if Windcave is configured
      if (!windcave.isConfigured()) {
        return res.status(503).json({
          error: 'Payment gateway not configured. Please contact support.'
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
        returnUrl: returnUrl || `${baseUrl}/invoices/${invoice._id}`,
        callbackUrl,
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

    // Query Windcave for latest session status
    const session = await windcave.getSession(invoice.windcavePaymentInfo.sessionId);

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

    const refundAmount = req.body.amount || invoice.paymentBreakdown.total;

    const refund = await windcave.processRefund(
      invoice.windcavePaymentInfo.transactionId,
      refundAmount,
      `REFUND-${invoice._id}`
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
