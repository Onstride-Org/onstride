const express = require('express');
const { body, param } = require('express-validator');
const Invoice = require('../models/Invoice');
const { authenticate, loadBarnContext, requireBarn, hasPermission, ownsResourceOrStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');

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
      invoices,
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

    // Calculate fees
    const platformFeePercent = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT) || 2.5;
    const platformFee = subtotal * (platformFeePercent / 100);
    const stripeFee = (subtotal * 0.029) + 0.30; // Stripe standard fee

    const invoice = await Invoice.create({
      barnId: req.barnId,
      boarderId,
      horseId,
      createdById: req.userId,
      dueDate,
      charges,
      notes,
      platformFeePercent,
      paymentBreakdown: {
        subtotal,
        stripeFee,
        platformFee,
        total: subtotal
      }
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('boarderId', 'name email')
      .populate('horseId', 'name');

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

// Process payment
router.post('/:id/payment', [
  param('id').isMongoId(),
  body('method').isIn(['card', 'ach', 'cash', 'check', 'other']),
  validate
], async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check ownership or staff
    const isOwner = invoice.boarderId.toString() === req.userId.toString();
    const isStaff = ['owner', 'admin', 'manager'].includes(req.user.accountType) ||
      (req.barnRole && ['owner', 'admin', 'manager'].includes(req.barnRole.role));

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { method, paymentMethodId } = req.body;

    // For card/ach, would integrate with Stripe here
    if (method === 'card' || method === 'ach') {
      // TODO: Create Stripe payment intent
      invoice.status = 'processing';
      // In real implementation:
      // const paymentIntent = await stripe.paymentIntents.create({...});
      // invoice.stripePaymentInfo = { paymentIntentId: paymentIntent.id };
    } else {
      // Cash/check - mark as paid directly (staff only)
      if (!isStaff) {
        return res.status(403).json({ error: 'Only staff can record manual payments' });
      }
      invoice.status = 'paid';
      invoice.paidAt = new Date();
    }

    invoice.method = method;
    await invoice.save();

    res.json(invoice);
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

// Stripe webhook (public route - no auth)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    // TODO: Verify Stripe signature
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    const event = JSON.parse(req.body);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const invoice = await Invoice.findOne({
          'stripePaymentInfo.paymentIntentId': paymentIntent.id
        });

        if (invoice) {
          invoice.status = 'paid';
          invoice.paidAt = new Date();
          invoice.stripePaymentInfo.chargeId = paymentIntent.latest_charge;
          await invoice.save();
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const invoice = await Invoice.findOne({
          'stripePaymentInfo.paymentIntentId': paymentIntent.id
        });

        if (invoice) {
          invoice.status = 'failed';
          invoice.failureReason = paymentIntent.last_payment_error?.message;
          await invoice.save();
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
