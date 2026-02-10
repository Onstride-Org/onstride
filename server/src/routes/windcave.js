const express = require('express');
const { body, param, validationResult } = require('express-validator');
const multer = require('multer');
const MerchantApplication = require('../models/MerchantApplication');
const Barn = require('../models/Barn');
const User = require('../models/User');
const { authenticate, loadBarnContext, requireBarn, hasRole } = require('../middleware/auth');
const emailService = require('../services/email');
const docuseal = require('../services/docuseal');

const router = express.Router();

// PDF upload for templates (memory storage, max 20MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// ============ DocuSeal Webhook (no auth — called externally by DocuSeal) ============
router.post('/webhook/docuseal', express.json(), async (req, res) => {
  try {
    const { event_type, data } = req.body;
    console.log('DocuSeal webhook received:', event_type, data?.submission_id || data?.id);

    if (event_type === 'submission.completed' || event_type === 'form.completed') {
      const submissionId = data?.submission_id || data?.id;
      if (!submissionId) return res.json({ received: true });

      const application = await MerchantApplication.findOne({ docusealSubmissionId: submissionId });
      if (application && application.status === 'draft') {
        application.status = 'submitted';
        application.submittedAt = new Date();
        application.addAuditLog('submitted_via_webhook', null, 'Application auto-submitted via DocuSeal webhook', '0.0.0.0');
        await application.save();

        const barn = await Barn.findById(application.barnId);
        emailService.sendMerchantApplicationNotification({
          barnName: barn?.name || 'Unknown Barn',
          barnId: application.barnId,
          legalName: barn?.name,
          submittedAt: application.submittedAt,
        }).catch(err => console.error('Failed to send merchant application notification:', err));

        console.log(`Application ${application._id} auto-submitted via DocuSeal webhook`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('DocuSeal webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Apply authentication and barn context to all subsequent routes
router.use(authenticate);
router.use(loadBarnContext);

// ============ DocuSeal Application Routes ============

// Get application for current barn (status + embed info)
router.get('/application', requireBarn, async (req, res, next) => {
  try {
    const application = await MerchantApplication.findByBarn(req.barnId);

    if (!application) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      _id: application._id,
      status: application.status,
      submittedAt: application.submittedAt,
      approvedAt: application.approvedAt,
      rejectedAt: application.rejectedAt,
      rejectionReason: application.rejectionReason,
      additionalInfoRequested: application.additionalInfoRequested,
      docusealSubmitterSlug: application.docusealSubmitterSlug,
      docusealSubmissionId: application.docusealSubmissionId,
      docusealTemplateId: application.docusealTemplateId,
      windcaveCredentials: application.windcaveCredentials?.merchantId ? {
        merchantId: application.windcaveCredentials.merchantId,
        isActive: application.windcaveCredentials.isActive,
        activatedAt: application.windcaveCredentials.activatedAt,
        testResult: application.windcaveCredentials.testResult,
      } : undefined,
    });
  } catch (error) {
    next(error);
  }
});

// Start a new application — creates DocuSeal submission and returns embed slug
router.post('/application/start', [
  requireBarn,
  hasRole('owner', 'admin'),
], async (req, res, next) => {
  try {
    if (!docuseal.isConfigured()) {
      return res.status(503).json({ error: 'Document signing service is not configured.' });
    }

    // Check for existing application
    let application = await MerchantApplication.findByBarn(req.barnId);

    // If there's already an active submission, return the existing slug
    if (application?.docusealSubmitterSlug && application.status === 'draft') {
      return res.json({
        applicationId: application._id,
        slug: application.docusealSubmitterSlug,
        embedUrl: docuseal.getFormEmbedUrl(application.docusealSubmitterSlug),
        status: application.status,
      });
    }

    // Find the active template — use the one set on the application or the newest one
    let templateId = req.body.templateId || application?.docusealTemplateId;

    if (!templateId) {
      // Use the most recent template
      const templates = await docuseal.listTemplates();
      if (!templates || templates.length === 0) {
        return res.status(400).json({ error: 'No application template has been configured. Please contact admin.' });
      }
      templateId = templates[0].id;
    }

    // Get user and barn info for pre-filling
    const [user, barn] = await Promise.all([
      User.findById(req.userId),
      Barn.findById(req.barnId),
    ]);

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // Create DocuSeal submission
    const submissionData = await docuseal.createSubmission({
      templateId,
      email: user.email,
      name: user.name || user.email,
      completedRedirectUrl: `${baseUrl}/app/financials?application=completed`,
      prefillData: {
        'Business Name': barn?.name || '',
        'Email': user.email || '',
        'Phone': barn?.phoneNumber || '',
        'Address': barn?.address || '',
        'City': barn?.city || '',
        'State': barn?.state || '',
        'Zip Code': barn?.zipCode || '',
      },
    });

    // Extract submitter info — DocuSeal returns array of submitters
    const submitters = Array.isArray(submissionData) ? submissionData : [submissionData];
    const submitter = submitters[0];
    const submissionId = submitter.submission_id || submitter.id;
    const slug = submitter.slug;

    // Create or update application record
    if (!application) {
      application = new MerchantApplication({
        barnId: req.barnId,
        userId: req.userId,
        status: 'draft',
        docusealTemplateId: templateId,
        docusealSubmissionId: submissionId,
        docusealSubmitterSlug: slug,
      });
    } else {
      application.docusealTemplateId = templateId;
      application.docusealSubmissionId = submissionId;
      application.docusealSubmitterSlug = slug;
      application.status = 'draft';
    }

    application.addAuditLog('docuseal_submission_created', req.userId, `DocuSeal submission ${submissionId} created`, req.ip);
    await application.save();

    res.json({
      applicationId: application._id,
      slug,
      embedUrl: docuseal.getFormEmbedUrl(slug),
      status: 'draft',
    });
  } catch (error) {
    console.error('Failed to start DocuSeal application:', error.response?.data || error.message);
    next(error);
  }
});

// Mark application as submitted (called after DocuSeal form completion)
router.post('/application/complete', [
  requireBarn,
  hasRole('owner', 'admin'),
], async (req, res, next) => {
  try {
    const application = await MerchantApplication.findByBarn(req.barnId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'draft') {
      return res.json({ status: application.status, message: 'Application already submitted.' });
    }

    application.status = 'submitted';
    application.submittedAt = new Date();
    application.addAuditLog('submitted', req.userId, 'Application submitted via DocuSeal', req.ip);
    await application.save();

    // Send notification to OnStride admin
    const barn = await Barn.findById(req.barnId);
    emailService.sendMerchantApplicationNotification({
      barnName: barn?.name || 'Unknown Barn',
      barnId: req.barnId,
      legalName: barn?.name,
      submittedAt: application.submittedAt,
    }).catch(err => console.error('Failed to send merchant application notification:', err));

    res.json({
      success: true,
      status: 'submitted',
      submittedAt: application.submittedAt,
      message: 'Your application has been submitted to Windcave for review.',
    });
  } catch (error) {
    next(error);
  }
});

// ============ Admin Template Management ============

// List templates
router.get('/templates', async (req, res, next) => {
  try {
    if (req.user.accountType !== 'admin') {
      // Non-admins can see available templates (limited info)
      const templates = await docuseal.listTemplates();
      return res.json(templates.map(t => ({
        id: t.id,
        name: t.name,
        created_at: t.created_at,
      })));
    }

    const templates = await docuseal.listTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Failed to list templates:', error.response?.data || error.message);
    next(error);
  }
});

// Upload a new PDF template
router.post('/templates', upload.single('pdf'), async (req, res, next) => {
  try {
    if (req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!docuseal.isConfigured()) {
      return res.status(503).json({ error: 'DocuSeal API is not configured. Please set DOCUSEAL_API_KEY.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const name = req.body.name || 'Merchant Application';
    const fileBase64 = req.file.buffer.toString('base64');

    const template = await docuseal.createTemplateFromPdf(name, fileBase64);
    res.json(template);
  } catch (error) {
    console.error('Failed to create template:', error.response?.data || error.message);
    // Return more specific error for DocuSeal API failures
    if (error.response?.data) {
      return res.status(error.response.status || 500).json({
        error: error.response.data.error || error.response.data.message || 'DocuSeal API error',
        details: error.response.data,
      });
    }
    next(error);
  }
});

// Delete a template
router.delete('/templates/:id', async (req, res, next) => {
  try {
    if (req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await docuseal.deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete template:', error.response?.data || error.message);
    next(error);
  }
});

// Get DocuSeal config info for admin (API key status, recipient email)
router.get('/docuseal-config', async (req, res, next) => {
  try {
    if (req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    res.json({
      isConfigured: docuseal.isConfigured(),
      applicationEmail: docuseal.getApplicationRecipientEmail(),
      apiUrl: process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com',
    });
  } catch (error) {
    next(error);
  }
});

// Get JWT token for embedded template builder (admin only)
// Authorized DocuSeal users: admin@onstrideapp.com, gal@onstrideapp.com
const DOCUSEAL_AUTHORIZED_EMAILS = ['admin@onstrideapp.com', 'gal@onstrideapp.com'];

router.get('/templates/:id/builder-token', async (req, res, next) => {
  try {
    if (req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const templateId = parseInt(req.params.id, 10);
    if (!templateId) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    // Use the user's email if they're authorized on DocuSeal, otherwise default to admin
    const userEmail = DOCUSEAL_AUTHORIZED_EMAILS.includes(req.user.email)
      ? req.user.email
      : 'admin@onstrideapp.com';

    const token = docuseal.generateBuilderToken(templateId, userEmail);
    if (!token) {
      return res.status(503).json({ error: 'DocuSeal API not configured' });
    }

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// ============ Admin Submissions ============

// List all submissions (admin)
router.get('/submissions', async (req, res, next) => {
  try {
    if (req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const templateId = req.query.templateId || null;
    const submissions = await docuseal.listSubmissions(templateId);
    res.json(submissions);
  } catch (error) {
    console.error('Failed to list submissions:', error.response?.data || error.message);
    next(error);
  }
});

// ============ Credentials (Post-Approval) — Unchanged ============

// Save Windcave credentials
router.post('/credentials', [
  requireBarn,
  hasRole('owner', 'admin'),
  body('merchantId').notEmpty().trim(),
  body('apiKey').notEmpty(),
  body('apiSecret').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { merchantId, apiKey, apiSecret } = req.body;

    let application = await MerchantApplication.findByBarn(req.barnId);

    if (!application) {
      const [barn, user] = await Promise.all([
        Barn.findById(req.barnId),
        User.findById(req.userId),
      ]);

      application = new MerchantApplication({
        barnId: req.barnId,
        userId: req.userId,
        status: 'approved',
        approvedAt: new Date(),
        merchantInfo: {
          legalName: barn?.name || 'Unknown',
          tradingName: barn?.name || 'Unknown',
          email: barn?.email || user?.email,
        },
        windcaveCredentials: {
          merchantId,
          apiKeyEncrypted: apiKey,
          apiSecretEncrypted: apiSecret,
          isActive: false,
        },
      });

      application.addAuditLog('direct_credentials_added', req.userId, 'Windcave credentials added directly', req.ip);
    } else {
      application.windcaveCredentials = {
        merchantId,
        apiKeyEncrypted: apiKey,
        apiSecretEncrypted: apiSecret,
        isActive: false,
      };

      if (application.status !== 'approved') {
        application.status = 'approved';
        application.approvedAt = new Date();
      }

      application.addAuditLog('credentials_updated', req.userId, 'Windcave credentials updated', req.ip);
    }

    await application.save();

    res.json({
      success: true,
      message: 'Credentials saved. Please test the connection to activate payment processing.',
    });
  } catch (error) {
    next(error);
  }
});

// Test Windcave connection
router.post('/test-connection', [
  requireBarn,
  hasRole('owner', 'admin'),
], async (req, res, next) => {
  try {
    const application = await MerchantApplication.findOne({ barnId: req.barnId })
      .select('+windcaveCredentials.apiKeyEncrypted +windcaveCredentials.apiSecretEncrypted');

    if (!application) {
      return res.status(404).json({ error: 'No credentials configured.' });
    }

    if (!application.windcaveCredentials?.merchantId) {
      return res.status(400).json({ error: 'No credentials configured' });
    }

    const credentials = application.getWindcaveCredentials();

    let testSuccess = false;
    let testMessage = '';

    try {
      const axios = require('axios');
      const testResponse = await axios.post(
        'https://sec.windcave.com/api/v1/sessions',
        {
          type: 'validate',
          amount: '1.00',
          currency: 'USD',
          merchantReference: `test-${Date.now()}`,
          methods: ['card'],
        },
        {
          auth: { username: credentials.apiKey, password: credentials.apiSecret },
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      if (testResponse.data?.id) {
        testSuccess = true;
        testMessage = 'Connection successful! Your Windcave account is now active.';
      } else {
        testMessage = 'Connection test returned unexpected response.';
      }
    } catch (apiError) {
      if (apiError.response?.status === 401) {
        testMessage = 'Authentication failed. Please check your API Key and API Secret.';
      } else if (apiError.response?.status === 403) {
        testMessage = 'Access denied. Your Windcave account may not have API access enabled.';
      } else if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ETIMEDOUT') {
        testMessage = 'Could not connect to Windcave. Please try again later.';
      } else {
        testMessage = apiError.response?.data?.errors?.[0]?.message || 'Connection failed.';
      }
    }

    application.windcaveCredentials.testResult = {
      success: testSuccess,
      message: testMessage,
      testedAt: new Date(),
    };
    application.windcaveCredentials.lastTestedAt = new Date();

    if (testSuccess) {
      application.windcaveCredentials.isActive = true;
      application.windcaveCredentials.activatedAt = new Date();
      application.addAuditLog('credentials_activated', req.userId, 'Payment processing activated', req.ip);
    } else {
      application.windcaveCredentials.isActive = false;
    }

    await application.save();

    res.json({
      success: testSuccess,
      message: testMessage,
      isActive: application.windcaveCredentials.isActive,
    });
  } catch (error) {
    next(error);
  }
});

// Get credential status
router.get('/credentials/status', requireBarn, async (req, res, next) => {
  try {
    const application = await MerchantApplication.findByBarn(req.barnId);

    if (!application) {
      return res.json({ hasApplication: false, status: null, isActive: false });
    }

    res.json({
      hasApplication: true,
      status: application.status,
      hasCredentials: !!application.windcaveCredentials?.merchantId,
      isActive: application.windcaveCredentials?.isActive || false,
      activatedAt: application.windcaveCredentials?.activatedAt,
      lastTestedAt: application.windcaveCredentials?.lastTestedAt,
      testResult: application.windcaveCredentials?.testResult,
    });
  } catch (error) {
    next(error);
  }
});

// ============ Admin Status Management ============

// Update application status (admin only)
router.put('/application/status', [
  authenticate,
  body('barnId').isMongoId(),
  body('status').isIn(['under_review', 'approved', 'rejected', 'requires_info']),
  body('reason').optional().trim(),
], async (req, res, next) => {
  try {
    if (req.user.accountType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { barnId, status, reason } = req.body;
    const application = await MerchantApplication.findByBarn(barnId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    application.status = status;

    switch (status) {
      case 'approved':
        application.approvedAt = new Date();
        break;
      case 'rejected':
        application.rejectedAt = new Date();
        application.rejectionReason = reason;
        break;
      case 'requires_info':
        application.additionalInfoRequested = reason;
        break;
    }

    application.addAuditLog(`status_changed_to_${status}`, req.userId, reason || '', req.ip);
    await application.save();

    res.json({
      success: true,
      status: application.status,
      message: `Application status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
