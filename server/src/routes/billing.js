const express = require('express');
const { body, param } = require('express-validator');
const BillingPeriod = require('../models/BillingPeriod');
const BillingTemplate = require('../models/BillingTemplate');
const Invoice = require('../models/Invoice');
const { authenticate, loadBarnContext, requireBarn, hasPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(loadBarnContext);

// ============ Billing Periods ============

// Get billing periods
router.get('/periods', requireBarn, async (req, res, next) => {
  try {
    const { clientId, status, page = 1, limit = 20 } = req.query;

    const filter = {
      barnId: req.barnId,
      ...(clientId && { clientId }),
      ...(status && { status })
    };

    const periods = await BillingPeriod.find(filter)
      .populate('clientId', 'name email')
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await BillingPeriod.countDocuments(filter);

    res.json({
      periods,
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

// Get billing period by ID
router.get('/periods/:id', async (req, res, next) => {
  try {
    const period = await BillingPeriod.findById(req.params.id)
      .populate('clientId', 'name email')
      .populate('invoiceId');

    if (!period) {
      return res.status(404).json({ error: 'Billing period not found' });
    }

    res.json(period);
  } catch (error) {
    next(error);
  }
});

// Create billing period
router.post('/periods', [
  requireBarn,
  hasPermission('generateInvoices'),
  body('clientId').isMongoId(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  validate
], async (req, res, next) => {
  try {
    const { clientId, startDate, endDate, dueDate, charges, previousBalance } = req.body;

    const period = await BillingPeriod.create({
      barnId: req.barnId,
      clientId,
      startDate,
      endDate,
      dueDate,
      charges: charges || [],
      previousBalance: previousBalance || 0,
      createdById: req.userId
    });

    period.calculateTotal();
    await period.save();

    const populated = await BillingPeriod.findById(period._id)
      .populate('clientId', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// Update billing period
router.put('/periods/:id', [
  hasPermission('generateInvoices'),
  validate
], async (req, res, next) => {
  try {
    const period = await BillingPeriod.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ error: 'Billing period not found' });
    }

    if (period.status === 'paid') {
      return res.status(400).json({ error: 'Cannot edit paid billing period' });
    }

    const { dueDate, notes, status } = req.body;

    if (dueDate) period.dueDate = dueDate;
    if (notes !== undefined) period.notes = notes;
    if (status) period.status = status;

    await period.save();

    res.json(period);
  } catch (error) {
    next(error);
  }
});

// Add charge to billing period
router.post('/periods/:id/charges', [
  hasPermission('generateInvoices'),
  body('type').notEmpty(),
  body('description').notEmpty(),
  body('amount').isNumeric(),
  validate
], async (req, res, next) => {
  try {
    const period = await BillingPeriod.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ error: 'Billing period not found' });
    }

    if (period.status === 'invoiced' || period.status === 'paid') {
      return res.status(400).json({ error: 'Cannot add charges to closed period' });
    }

    const charge = {
      ...req.body,
      date: req.body.date || new Date(),
      createdById: req.userId
    };

    period.charges.push(charge);
    period.calculateTotal();
    await period.save();

    res.json(period);
  } catch (error) {
    next(error);
  }
});

// Update charge
router.put('/periods/:id/charges/:chargeId', [
  hasPermission('generateInvoices'),
  validate
], async (req, res, next) => {
  try {
    const period = await BillingPeriod.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ error: 'Billing period not found' });
    }

    const charge = period.charges.id(req.params.chargeId);
    if (!charge) {
      return res.status(404).json({ error: 'Charge not found' });
    }

    Object.assign(charge, req.body);
    period.calculateTotal();
    await period.save();

    res.json(period);
  } catch (error) {
    next(error);
  }
});

// Delete charge
router.delete('/periods/:id/charges/:chargeId', [
  hasPermission('generateInvoices')
], async (req, res, next) => {
  try {
    const period = await BillingPeriod.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ error: 'Billing period not found' });
    }

    period.charges.pull(req.params.chargeId);
    period.calculateTotal();
    await period.save();

    res.json(period);
  } catch (error) {
    next(error);
  }
});

// Generate invoice from billing period
router.post('/periods/:id/generate-invoice', [
  hasPermission('generateInvoices')
], async (req, res, next) => {
  try {
    const period = await BillingPeriod.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ error: 'Billing period not found' });
    }

    if (period.status === 'invoiced' || period.status === 'paid') {
      return res.status(400).json({ error: 'Invoice already generated' });
    }

    // Convert charges to invoice format
    const invoiceCharges = period.charges
      .filter(c => c.status !== 'cancelled')
      .map(c => ({
        type: c.type,
        description: c.description,
        amount: c.amount,
        quantity: c.quantity || 1
      }));

    // Add previous balance if any
    if (period.previousBalance > 0) {
      invoiceCharges.unshift({
        type: 'other',
        description: 'Previous Balance',
        amount: period.previousBalance,
        quantity: 1
      });
    }

    // Create invoice
    const invoice = await Invoice.create({
      barnId: period.barnId,
      boarderId: period.clientId,
      createdById: req.userId,
      dueDate: period.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      charges: invoiceCharges,
      notes: period.notes
    });

    // Update period
    period.status = 'invoiced';
    period.invoiceId = invoice._id;
    period.invoicedAt = new Date();
    await period.save();

    const populated = await Invoice.findById(invoice._id)
      .populate('boarderId', 'name email');

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// ============ Billing Templates ============

// Get templates
router.get('/templates', requireBarn, async (req, res, next) => {
  try {
    const templates = await BillingTemplate.find({
      barnId: req.barnId,
      isActive: true
    }).sort({ name: 1 });

    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Get template by ID
router.get('/templates/:id', async (req, res, next) => {
  try {
    const template = await BillingTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Create template
router.post('/templates', [
  requireBarn,
  hasPermission('generateInvoices'),
  body('name').trim().notEmpty(),
  body('charges').isArray({ min: 1 }),
  validate
], async (req, res, next) => {
  try {
    const template = await BillingTemplate.create({
      ...req.body,
      barnId: req.barnId,
      createdById: req.userId
    });

    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

// Update template
router.put('/templates/:id', [
  hasPermission('generateInvoices'),
  validate
], async (req, res, next) => {
  try {
    const template = await BillingTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Delete template
router.delete('/templates/:id', [
  hasPermission('generateInvoices')
], async (req, res, next) => {
  try {
    const template = await BillingTemplate.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted' });
  } catch (error) {
    next(error);
  }
});

// Apply template to billing period
router.post('/periods/:id/apply-template', [
  hasPermission('generateInvoices'),
  body('templateId').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const [period, template] = await Promise.all([
      BillingPeriod.findById(req.params.id),
      BillingTemplate.findById(req.body.templateId)
    ]);

    if (!period) {
      return res.status(404).json({ error: 'Billing period not found' });
    }
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Add template charges
    template.charges.forEach(tc => {
      period.charges.push({
        type: tc.type,
        description: tc.description,
        amount: tc.amount,
        quantity: tc.quantity || 1,
        date: new Date(),
        createdById: req.userId
      });
    });

    period.calculateTotal();
    await period.save();

    res.json(period);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
