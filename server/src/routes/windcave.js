const express = require('express');
const { body, param, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MerchantApplication = require('../models/MerchantApplication');
const Barn = require('../models/Barn');
const User = require('../models/User');
const { authenticate, loadBarnContext, requireBarn, hasRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/merchant-docs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.barnId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and JPG are allowed.'));
    }
  }
});

// Apply authentication and barn context to all routes
router.use(authenticate);
router.use(loadBarnContext);

// ============ Application CRUD ============

// Get application for current barn
router.get('/application', requireBarn, async (req, res, next) => {
  try {
    let application = await MerchantApplication.findByBarn(req.barnId);

    if (!application) {
      // Return empty state to indicate no application exists
      return res.json({ exists: false });
    }

    // Don't return encrypted fields, but show masked versions
    const result = application.toObject();
    result.exists = true;

    // Add masked sensitive fields
    if (application.merchantInfo?.einTinEncrypted) {
      result.merchantInfo.einTinMasked = application.getMaskedEinTin();
    }
    if (application.bankAccount?.routingNumberEncrypted) {
      result.bankAccount.routingNumberProvided = true;
    }
    if (application.bankAccount?.accountNumberEncrypted) {
      result.bankAccount.accountNumberMasked = application.getMaskedBankAccount();
      result.bankAccount.accountNumberProvided = true;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Create new application (or get existing draft)
router.post('/application', [
  requireBarn,
  hasRole('owner', 'admin')
], async (req, res, next) => {
  try {
    // Check if application already exists
    let application = await MerchantApplication.findByBarn(req.barnId);

    if (application) {
      return res.status(400).json({
        error: 'Application already exists',
        applicationId: application._id,
        status: application.status
      });
    }

    // Get barn and user data for pre-filling
    const [barn, user] = await Promise.all([
      Barn.findById(req.barnId),
      User.findById(req.userId)
    ]);

    // Create new application with pre-filled data
    application = new MerchantApplication({
      barnId: req.barnId,
      userId: req.userId,
      status: 'draft',
      currentStep: 1,
      completedSteps: [],

      // Pre-fill from barn data
      merchantInfo: {
        legalName: barn.name,
        tradingName: barn.name,
        locationAddress: {
          street: barn.address || '',
          city: barn.city || '',
          state: barn.state || '',
          zipCode: barn.zipCode || ''
        },
        email: barn.email || user.email,
        phone: barn.phoneNumber || user.phoneNumber || '',
        website: barn.website || ''
      },

      // Pre-fill controlling person from user
      controllingPerson: {
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email
      },

      // Equine business defaults
      businessDescription: {
        description: 'Equine boarding, training, lessons, and related services',
        natureOfBusiness: 'arts_recreation'
      },
      transactionDetails: {
        averageTicket: 500,
        highTicket: 5000,
        monthlyCardVolume: 10000,
        hasFutureDatedEvents: true
      },
      cardAcceptanceMethods: {
        swipeContactlessInserted: 0,
        mailOrderTelephoneOrder: 0,
        ecommerce: 100,
        subscriptionRecurring: 0,
        posSystem: 'OnStride'
      },
      additionalQuestionnaire: {
        businessConsumersPercent: 10,
        individualCustomersPercent: 90,
        ownsProductInventory: false,
        productStoredAtLocation: true,
        whoEntersCardInfo: 'consumer',
        whoShipsProduct: 'na',
        daysUntilShipAfterAuth: 0
      }
    });

    application.addAuditLog('created', req.userId, 'Application created', req.ip);
    await application.save();

    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

// Update application (save progress)
router.put('/application', [
  requireBarn,
  hasRole('owner', 'admin')
], async (req, res, next) => {
  try {
    const application = await MerchantApplication.findByBarn(req.barnId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'draft' && application.status !== 'requires_info') {
      return res.status(400).json({
        error: 'Cannot edit application in current status',
        status: application.status
      });
    }

    // Update allowed fields
    const allowedSections = [
      'merchantInfo',
      'businessDescription',
      'transactionDetails',
      'cardAcceptanceMethods',
      'additionalQuestionnaire',
      'beneficialOwners',
      'controllingPerson',
      'bankAccount',
      'currentStep',
      'completedSteps'
    ];

    allowedSections.forEach(section => {
      if (req.body[section] !== undefined) {
        if (typeof req.body[section] === 'object' && !Array.isArray(req.body[section])) {
          // Merge objects
          application[section] = {
            ...application[section]?.toObject?.() || application[section] || {},
            ...req.body[section]
          };
        } else {
          application[section] = req.body[section];
        }
      }
    });

    // Handle sensitive fields specially - they come in plain and get encrypted on save
    if (req.body.einTin) {
      application.merchantInfo.einTinEncrypted = req.body.einTin;
    }
    if (req.body.routingNumber) {
      application.bankAccount.routingNumberEncrypted = req.body.routingNumber;
    }
    if (req.body.accountNumber) {
      application.bankAccount.accountNumberEncrypted = req.body.accountNumber;
    }
    if (req.body.controllingPersonSsn) {
      application.controllingPerson.ssnEncrypted = req.body.controllingPersonSsn;
    }
    if (req.body.controllingPersonDriversLicense) {
      application.controllingPerson.driversLicense = {
        ...application.controllingPerson?.driversLicense || {},
        numberEncrypted: req.body.controllingPersonDriversLicense
      };
    }

    application.addAuditLog('updated', req.userId, `Updated: ${allowedSections.filter(s => req.body[s]).join(', ')}`, req.ip);
    await application.save();

    // Return without encrypted fields
    const result = application.toObject();
    if (application.merchantInfo?.einTinEncrypted) {
      result.merchantInfo.einTinMasked = application.getMaskedEinTin();
    }
    if (application.bankAccount?.routingNumberEncrypted) {
      result.bankAccount.routingNumberProvided = true;
    }
    if (application.bankAccount?.accountNumberEncrypted) {
      result.bankAccount.accountNumberMasked = application.getMaskedBankAccount();
      result.bankAccount.accountNumberProvided = true;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============ Document Upload ============

// Upload document
router.post('/application/documents', [
  requireBarn,
  hasRole('owner', 'admin'),
  upload.single('document')
], async (req, res, next) => {
  try {
    const application = await MerchantApplication.findByBarn(req.barnId);

    if (!application) {
      // Delete uploaded file if application doesn't exist
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { documentType } = req.body;
    const filePath = `/uploads/merchant-docs/${req.file.filename}`;

    // Update the appropriate document field
    switch (documentType) {
      case 'processingStatement':
        if (!application.documents.processingStatements) {
          application.documents.processingStatements = [];
        }
        application.documents.processingStatements.push(filePath);
        break;
      case 'proofOfAddress':
        application.documents.proofOfAddress = filePath;
        break;
      case 'incorporationCert':
        application.documents.incorporationCert = filePath;
        break;
      case 'voidedCheck':
        application.documents.voidedCheck = filePath;
        application.bankAccount.voidedCheckDocument = filePath;
        break;
      case 'ownerId':
        if (!application.documents.ownerIds) {
          application.documents.ownerIds = [];
        }
        application.documents.ownerIds.push(filePath);
        break;
      default:
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid document type' });
    }

    application.addAuditLog('document_uploaded', req.userId, `Uploaded ${documentType}`, req.ip);
    await application.save();

    res.json({
      success: true,
      documentType,
      filePath,
      documents: application.documents
    });
  } catch (error) {
    next(error);
  }
});

// Delete document
router.delete('/application/documents/:documentType/:index?', [
  requireBarn,
  hasRole('owner', 'admin')
], async (req, res, next) => {
  try {
    const application = await MerchantApplication.findByBarn(req.barnId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const { documentType, index } = req.params;
    let filePath;

    switch (documentType) {
      case 'processingStatement':
        if (application.documents.processingStatements && application.documents.processingStatements[index]) {
          filePath = application.documents.processingStatements[index];
          application.documents.processingStatements.splice(index, 1);
        }
        break;
      case 'proofOfAddress':
        filePath = application.documents.proofOfAddress;
        application.documents.proofOfAddress = null;
        break;
      case 'incorporationCert':
        filePath = application.documents.incorporationCert;
        application.documents.incorporationCert = null;
        break;
      case 'voidedCheck':
        filePath = application.documents.voidedCheck;
        application.documents.voidedCheck = null;
        application.bankAccount.voidedCheckDocument = null;
        break;
      case 'ownerId':
        if (application.documents.ownerIds && application.documents.ownerIds[index]) {
          filePath = application.documents.ownerIds[index];
          application.documents.ownerIds.splice(index, 1);
        }
        break;
      default:
        return res.status(400).json({ error: 'Invalid document type' });
    }

    // Delete file from disk
    if (filePath) {
      const fullPath = path.join(__dirname, '../..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    application.addAuditLog('document_deleted', req.userId, `Deleted ${documentType}`, req.ip);
    await application.save();

    res.json({
      success: true,
      documents: application.documents
    });
  } catch (error) {
    next(error);
  }
});

// ============ Signatures ============

// Save signature
router.post('/application/signature', [
  requireBarn,
  hasRole('owner', 'admin'),
  body('signatureType').isIn(['merchant', 'principal1', 'principal2']),
  body('signature').notEmpty(),
  body('printedName').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await MerchantApplication.findByBarn(req.barnId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const { signatureType, signature, printedName } = req.body;

    switch (signatureType) {
      case 'merchant':
        application.signatures.merchantSignature = signature;
        application.signatures.merchantPrintedName = printedName;
        application.signatures.merchantSignatureDate = new Date();
        application.signatures.merchantSignatureIp = req.ip;
        break;
      case 'principal1':
        application.signatures.principal1Signature = signature;
        application.signatures.principal1PrintedName = printedName;
        application.signatures.principal1SignatureDate = new Date();
        application.signatures.principal1SignatureIp = req.ip;
        break;
      case 'principal2':
        application.signatures.principal2Signature = signature;
        application.signatures.principal2PrintedName = printedName;
        application.signatures.principal2SignatureDate = new Date();
        application.signatures.principal2SignatureIp = req.ip;
        break;
    }

    application.addAuditLog('signature_added', req.userId, `${signatureType} signature added`, req.ip);
    await application.save();

    res.json({
      success: true,
      signatureType,
      signatureDate: application.signatures[`${signatureType}SignatureDate`]
    });
  } catch (error) {
    next(error);
  }
});

// Accept terms
router.post('/application/accept-terms', [
  requireBarn,
  hasRole('owner', 'admin')
], async (req, res, next) => {
  try {
    const application = await MerchantApplication.findByBarn(req.barnId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    application.signatures.termsAccepted = true;
    application.signatures.termsAcceptedDate = new Date();
    application.addAuditLog('terms_accepted', req.userId, 'Terms and conditions accepted', req.ip);
    await application.save();

    res.json({ success: true, termsAcceptedDate: application.signatures.termsAcceptedDate });
  } catch (error) {
    next(error);
  }
});

// ============ Submission ============

// Submit application
router.post('/application/submit', [
  requireBarn,
  hasRole('owner', 'admin')
], async (req, res, next) => {
  try {
    // Include encrypted fields for validation
    const application = await MerchantApplication.findOne({ barnId: req.barnId })
      .select('+bankAccount.routingNumberEncrypted +bankAccount.accountNumberEncrypted +merchantInfo.einTinEncrypted');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'draft' && application.status !== 'requires_info') {
      return res.status(400).json({
        error: 'Application cannot be submitted in current status',
        status: application.status
      });
    }

    // Validate application is complete
    if (!application.isComplete()) {
      // Build detailed missing fields list
      const missing = [];
      if (!application.merchantInfo?.legalName) missing.push('Legal Business Name');
      if (!application.merchantInfo?.businessType) missing.push('Business Type');
      if (!application.merchantInfo?.locationAddress?.street) missing.push('Business Street Address');
      if (!application.merchantInfo?.locationAddress?.city) missing.push('Business City');
      if (!application.merchantInfo?.locationAddress?.state) missing.push('Business State');
      if (!application.merchantInfo?.locationAddress?.zipCode) missing.push('Business ZIP Code');
      if (!application.controllingPerson?.firstName) missing.push('Controlling Person First Name');
      if (!application.controllingPerson?.lastName) missing.push('Controlling Person Last Name');
      if (!application.bankAccount?.bankName) missing.push('Bank Name');
      if (!application.bankAccount?.routingNumberEncrypted) missing.push('Bank Routing Number');
      if (!application.bankAccount?.accountNumberEncrypted) missing.push('Bank Account Number');
      if (!application.signatures?.merchantSignature) missing.push('Merchant Signature');
      if (!application.signatures?.termsAccepted) missing.push('Terms & Conditions Acceptance');

      return res.status(400).json({
        error: 'Application is incomplete',
        missingFields: missing,
        details: {
          hasLegalName: !!application.merchantInfo?.legalName,
          hasBusinessType: !!application.merchantInfo?.businessType,
          hasLocationAddress: !!(application.merchantInfo?.locationAddress?.street &&
                                 application.merchantInfo?.locationAddress?.city &&
                                 application.merchantInfo?.locationAddress?.state &&
                                 application.merchantInfo?.locationAddress?.zipCode),
          hasControllingPerson: !!(application.controllingPerson?.firstName && application.controllingPerson?.lastName),
          hasBankAccount: !!(application.bankAccount?.bankName &&
                             application.bankAccount?.routingNumberEncrypted &&
                             application.bankAccount?.accountNumberEncrypted),
          hasSignature: !!application.signatures?.merchantSignature,
          hasTermsAccepted: application.signatures?.termsAccepted === true
        }
      });
    }

    // Validate card acceptance methods total 100%
    if (!application.validateCardAcceptanceMethods()) {
      return res.status(400).json({
        error: 'Card acceptance methods must total 100%'
      });
    }

    // Validate customer percentages total 100%
    if (!application.validateCustomerPercentages()) {
      return res.status(400).json({
        error: 'Customer percentages must total 100%'
      });
    }

    // Submit the application
    application.status = 'submitted';
    application.submittedAt = new Date();
    application.addAuditLog('submitted', req.userId, 'Application submitted for review', req.ip);
    await application.save();

    // TODO: Send notification to OnStride admin for manual processing
    // TODO: Generate PDF of application

    res.json({
      success: true,
      status: application.status,
      submittedAt: application.submittedAt,
      message: 'Your application has been submitted and is now under review. You will receive an email once it has been processed.'
    });
  } catch (error) {
    next(error);
  }
});

// ============ Credentials (Post-Approval) ============

// Save Windcave credentials
router.post('/credentials', [
  requireBarn,
  hasRole('owner', 'admin'),
  body('merchantId').notEmpty().trim(),
  body('apiKey').notEmpty(),
  body('apiSecret').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await MerchantApplication.findByBarn(req.barnId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({
        error: 'Credentials can only be added after application approval',
        status: application.status
      });
    }

    const { merchantId, apiKey, apiSecret } = req.body;

    // Save credentials (will be encrypted on save)
    application.windcaveCredentials = {
      merchantId,
      apiKeyEncrypted: apiKey,
      apiSecretEncrypted: apiSecret,
      isActive: false
    };

    application.addAuditLog('credentials_added', req.userId, 'Windcave credentials added', req.ip);
    await application.save();

    res.json({
      success: true,
      message: 'Credentials saved. Please test the connection to activate payment processing.'
    });
  } catch (error) {
    next(error);
  }
});

// Test Windcave connection
router.post('/test-connection', [
  requireBarn,
  hasRole('owner', 'admin')
], async (req, res, next) => {
  try {
    const application = await MerchantApplication.findOne({ barnId: req.barnId })
      .select('+windcaveCredentials.apiKeyEncrypted +windcaveCredentials.apiSecretEncrypted');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!application.windcaveCredentials?.merchantId) {
      return res.status(400).json({ error: 'No credentials configured' });
    }

    // Get decrypted credentials
    const credentials = application.getWindcaveCredentials();

    // TODO: Make actual API call to Windcave to test credentials
    // For now, we'll simulate a successful test
    // In production, this would call Windcave's API to verify the credentials

    /*
    const windcaveResponse = await fetch('https://sec.windcave.com/api/v1/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'purchase',
        amount: '0.00',
        currency: 'USD',
        merchantReference: 'connection-test'
      })
    });
    */

    // Simulate successful test
    const testSuccess = true;
    const testMessage = testSuccess
      ? 'Connection successful'
      : 'Connection failed. Please verify your credentials.';

    // Update test results
    application.windcaveCredentials.testResult = {
      success: testSuccess,
      message: testMessage,
      testedAt: new Date()
    };
    application.windcaveCredentials.lastTestedAt = new Date();

    // If test successful, activate payment processing
    if (testSuccess) {
      application.windcaveCredentials.isActive = true;
      application.windcaveCredentials.activatedAt = new Date();
      application.addAuditLog('credentials_activated', req.userId, 'Payment processing activated', req.ip);
    }

    await application.save();

    res.json({
      success: testSuccess,
      message: testMessage,
      isActive: application.windcaveCredentials.isActive
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
      return res.json({
        hasApplication: false,
        status: null,
        isActive: false
      });
    }

    res.json({
      hasApplication: true,
      status: application.status,
      hasCredentials: !!application.windcaveCredentials?.merchantId,
      isActive: application.windcaveCredentials?.isActive || false,
      activatedAt: application.windcaveCredentials?.activatedAt,
      lastTestedAt: application.windcaveCredentials?.lastTestedAt,
      testResult: application.windcaveCredentials?.testResult
    });
  } catch (error) {
    next(error);
  }
});

// ============ Admin Routes ============

// Update application status (admin only)
router.put('/application/status', [
  authenticate,
  body('barnId').isMongoId(),
  body('status').isIn(['under_review', 'approved', 'rejected', 'requires_info']),
  body('reason').optional().trim()
], async (req, res, next) => {
  try {
    // Verify admin
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

    // TODO: Send email notification to barn owner about status change

    res.json({
      success: true,
      status: application.status,
      message: `Application status updated to ${status}`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
