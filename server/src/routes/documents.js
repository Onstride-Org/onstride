const express = require('express');
const { body, param } = require('express-validator');
const { DocumentTemplate, GeneratedDocument } = require('../models/Document');
const { authenticate, loadBarnContext, requireBarn, hasPermission, isStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(loadBarnContext);

// ============ Document Templates ============

// Get templates
router.get('/templates', requireBarn, async (req, res, next) => {
  try {
    const { type, includeSystem } = req.query;

    const filter = {
      $or: [
        { barnId: req.barnId },
        { isSystemTemplate: true }
      ],
      isActive: true,
      ...(type && { type })
    };

    if (includeSystem === 'false') {
      filter.$or = [{ barnId: req.barnId }];
    }

    const templates = await DocumentTemplate.find(filter)
      .sort({ isSystemTemplate: -1, name: 1 });

    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Get template by ID
router.get('/templates/:id', async (req, res, next) => {
  try {
    const template = await DocumentTemplate.findById(req.params.id);
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
  isStaff,
  body('name').trim().notEmpty(),
  body('type').isIn(['boardingAgreement', 'liabilityWaiver', 'leaseAgreement', 'billOfSale', 'trainingAgreement', 'lessonWaiver', 'emergencyContact', 'medicalAuth', 'custom']),
  body('content').notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const template = await DocumentTemplate.create({
      ...req.body,
      barnId: req.barnId,
      createdBy: req.userId
    });

    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

// Update template
router.put('/templates/:id', [
  isStaff,
  validate
], async (req, res, next) => {
  try {
    const template = await DocumentTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Cannot edit system templates
    if (template.isSystemTemplate) {
      return res.status(403).json({ error: 'Cannot edit system templates' });
    }

    const { name, content, description, placeholders, isActive } = req.body;

    if (name) template.name = name;
    if (content) template.content = content;
    if (description !== undefined) template.description = description;
    if (placeholders) template.placeholders = placeholders;
    if (isActive !== undefined) template.isActive = isActive;
    template.version += 1;

    await template.save();

    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Delete template
router.delete('/templates/:id', [
  isStaff
], async (req, res, next) => {
  try {
    const template = await DocumentTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (template.isSystemTemplate) {
      return res.status(403).json({ error: 'Cannot delete system templates' });
    }

    template.isActive = false;
    await template.save();

    res.json({ message: 'Template deleted' });
  } catch (error) {
    next(error);
  }
});

// ============ Generated Documents ============

// Get generated documents
router.get('/generated', requireBarn, async (req, res, next) => {
  try {
    const { status, clientId, templateId, page = 1, limit = 20 } = req.query;

    const filter = {
      barnId: req.barnId,
      ...(status && { status }),
      ...(clientId && { clientId }),
      ...(templateId && { templateId })
    };

    const documents = await GeneratedDocument.find(filter)
      .populate('templateId', 'name type')
      .populate('clientId', 'name email')
      .populate('horseId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await GeneratedDocument.countDocuments(filter);

    res.json({
      documents,
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

// Get generated document by ID
router.get('/generated/:id', async (req, res, next) => {
  try {
    const document = await GeneratedDocument.findById(req.params.id)
      .populate('templateId')
      .populate('clientId', 'name email')
      .populate('horseId', 'name');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Generate document from template
router.post('/generate', [
  requireBarn,
  isStaff,
  body('templateId').isMongoId(),
  body('values').isObject(),
  validate
], async (req, res, next) => {
  try {
    const { templateId, values, clientId, horseId, signatures } = req.body;

    const template = await DocumentTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Render template with values
    let renderedContent = template.content;
    for (const [key, value] of Object.entries(values)) {
      const placeholder = `{{${key}}}`;
      renderedContent = renderedContent.replace(new RegExp(placeholder, 'g'), value);
    }

    // Get client and horse names
    let clientName, horseName;
    if (clientId) {
      const client = await require('../models/User').findById(clientId);
      clientName = client?.name;
    }
    if (horseId) {
      const horse = await require('../models/Horse').findById(horseId);
      horseName = horse?.name;
    }

    const document = await GeneratedDocument.create({
      barnId: req.barnId,
      templateId,
      templateName: template.name,
      renderedContent,
      filledValues: values,
      clientId,
      clientName,
      horseId,
      horseName,
      signatures: signatures || [],
      status: signatures?.length > 0 ? 'pendingSignature' : 'draft',
      createdBy: req.userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

// Send document for signature
router.post('/generated/:id/send', [
  isStaff
], async (req, res, next) => {
  try {
    const document = await GeneratedDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.signatures.length === 0) {
      return res.status(400).json({ error: 'No signatures configured' });
    }

    document.status = 'pendingSignature';
    document.sentAt = new Date();
    await document.save();

    // TODO: Send email to signers

    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Sign document
router.post('/generated/:id/sign', [
  body('signatureImageUrl').optional(),
  validate
], async (req, res, next) => {
  try {
    const document = await GeneratedDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Find signer
    const signature = document.signatures.find(s =>
      s.signerId?.toString() === req.userId.toString() ||
      s.signerEmail === req.user.email
    );

    if (!signature) {
      return res.status(403).json({ error: 'Not authorized to sign this document' });
    }

    if (signature.isSigned) {
      return res.status(400).json({ error: 'Already signed' });
    }

    signature.isSigned = true;
    signature.signedAt = new Date();
    signature.signatureImageUrl = req.body.signatureImageUrl;
    signature.ipAddress = req.ip;

    // Check if all signatures complete
    const allSigned = document.signatures.every(s => s.isSigned);
    if (allSigned) {
      document.status = 'fullySigned';
      document.completedAt = new Date();
    } else {
      document.status = 'partiallySigned';
    }

    await document.save();

    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Cancel document
router.post('/generated/:id/cancel', [
  isStaff
], async (req, res, next) => {
  try {
    const document = await GeneratedDocument.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    next(error);
  }
});

// ============ System Templates (Admin) ============

// Seed system templates
router.post('/templates/seed', async (req, res, next) => {
  try {
    if (req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const templates = [
      {
        name: 'Boarding Agreement',
        type: 'boardingAgreement',
        description: 'Standard horse boarding agreement',
        content: `
# HORSE BOARDING AGREEMENT

This agreement is entered into on {{date}} between:

**Barn:** {{barnName}}
**Owner/Boarder:** {{clientName}}
**Horse:** {{horseName}}

## Terms and Conditions

1. **Monthly Board Rate:** ${{monthlyRate}}
2. **Payment Due:** {{paymentDueDay}} of each month
3. **Services Included:** {{servicesIncluded}}

## Liability Waiver

The horse owner agrees to hold harmless {{barnName}} from any claims arising from the boarding of the horse.

**Owner Signature:** _____________________ Date: _______
**Barn Representative:** _____________________ Date: _______
        `.trim(),
        placeholders: [
          { key: 'date', label: 'Agreement Date', type: 'date', required: true },
          { key: 'barnName', label: 'Barn Name', type: 'text', required: true },
          { key: 'clientName', label: 'Client Name', type: 'text', required: true },
          { key: 'horseName', label: 'Horse Name', type: 'text', required: true },
          { key: 'monthlyRate', label: 'Monthly Rate', type: 'number', required: true },
          { key: 'paymentDueDay', label: 'Payment Due Day', type: 'text', defaultValue: '1st' },
          { key: 'servicesIncluded', label: 'Services Included', type: 'textarea' }
        ],
        isSystemTemplate: true,
        isActive: true
      },
      {
        name: 'Liability Waiver',
        type: 'liabilityWaiver',
        description: 'General liability waiver for horseback riding activities',
        content: `
# LIABILITY WAIVER AND RELEASE

I, {{clientName}}, acknowledge that horseback riding and related equestrian activities are inherently dangerous.

I voluntarily agree to assume all risks of injury or death that may result from participating in activities at {{barnName}}.

I hereby release {{barnName}}, its owners, employees, and agents from any and all liability for injury or death.

**Participant Signature:** _____________________ Date: _______

**Emergency Contact:** {{emergencyContact}} Phone: {{emergencyPhone}}
        `.trim(),
        placeholders: [
          { key: 'clientName', label: 'Participant Name', type: 'text', required: true },
          { key: 'barnName', label: 'Barn Name', type: 'text', required: true },
          { key: 'emergencyContact', label: 'Emergency Contact', type: 'text', required: true },
          { key: 'emergencyPhone', label: 'Emergency Phone', type: 'text', required: true }
        ],
        isSystemTemplate: true,
        isActive: true
      },
      {
        name: 'Lesson Waiver',
        type: 'lessonWaiver',
        description: 'Waiver for riding lessons',
        content: `
# RIDING LESSON WAIVER

**Student:** {{studentName}}
**Date:** {{date}}

I acknowledge that I am participating in riding lessons at {{barnName}} and understand the inherent risks involved in horseback riding.

I agree to follow all safety instructions provided by the instructor.

**Student/Guardian Signature:** _____________________ Date: _______
        `.trim(),
        placeholders: [
          { key: 'studentName', label: 'Student Name', type: 'text', required: true },
          { key: 'date', label: 'Date', type: 'date', required: true },
          { key: 'barnName', label: 'Barn Name', type: 'text', required: true }
        ],
        isSystemTemplate: true,
        isActive: true
      }
    ];

    for (const template of templates) {
      await DocumentTemplate.findOneAndUpdate(
        { name: template.name, isSystemTemplate: true },
        template,
        { upsert: true }
      );
    }

    res.json({ message: 'System templates seeded successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
