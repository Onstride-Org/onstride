const mongoose = require('mongoose');
const { encrypt, decrypt, mask } = require('../utils/encryption');

// Address schema (reusable)
const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  zipCode: { type: String, trim: true }
}, { _id: false });

// Beneficial owner schema
const beneficialOwnerSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  title: { type: String, trim: true },
  percentOwnership: { type: Number, min: 25, max: 100 },
  homePhone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  ssnEncrypted: { type: String, select: false }, // Encrypted SSN
  dateOfBirth: Date,
  driversLicense: {
    numberEncrypted: { type: String, select: false }, // Encrypted
    state: String
  },
  homeAddress: addressSchema
});

// Controlling person schema
// Note: required validation is handled by isComplete() before submission, not at schema level,
// so draft applications can be saved without all fields filled in.
const controllingPersonSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  title: { type: String, trim: true },
  percentOwnership: Number,
  homePhone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  ssnEncrypted: { type: String, select: false },
  dateOfBirth: Date,
  driversLicense: {
    numberEncrypted: { type: String, select: false },
    state: String
  },
  homeAddress: addressSchema
}, { _id: false });

// Main merchant application schema
const merchantApplicationSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Application Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'requires_info'],
    default: 'draft'
  },
  submittedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  additionalInfoRequested: String,

  // DocuSeal integration
  docusealTemplateId: Number,
  docusealSubmissionId: Number,
  docusealSubmitterSlug: String,

  // Current wizard step (legacy - kept for backward compat)
  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 8
  },
  completedSteps: [{
    type: Number
  }],

  // Section 1: Merchant Information
  merchantInfo: {
    legalName: { type: String, trim: true },
    tradingName: { type: String, trim: true }, // DBA
    businessType: {
      type: String,
      enum: ['corporation', 'llc', 'sole_proprietor', 'partnership', 'nonprofit_501c3', 'government', 'publicly_traded']
    },
    tickerSymbol: String, // If publicly traded

    // Physical Location (No PO Box)
    locationAddress: addressSchema,

    // Mailing Address
    postalAddress: addressSchema,
    postalSameAsLocation: { type: Boolean, default: false },

    // Contact
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },

    // Tax ID (Encrypted)
    einTinEncrypted: { type: String, select: false }
  },

  // Section 2: Business Description & Risk
  businessDescription: {
    description: {
      type: String,
      default: 'Equine boarding, training, lessons, and related services'
    },
    natureOfBusiness: {
      type: String,
      enum: [
        'administrative', 'arts_recreation', 'construction', 'education',
        'financial_services', 'food_services', 'health_care', 'hospitality_lodging',
        'manufacturing', 'media', 'parking_car_wash', 'retail',
        'technical_services', 'utility_services', 'wholesale'
      ],
      default: 'arts_recreation'
    },

    // Compliance History
    legalActionByRegulator: { type: Boolean, default: false },
    legalActionExplanation: String,
    finedByCardNetwork: { type: Boolean, default: false },
    fineExplanation: String
  },

  // Section 3: Transaction & Volume Details
  transactionDetails: {
    averageTicket: { type: Number, default: 500 },
    highTicket: { type: Number, default: 5000 },
    monthlyCardVolume: { type: Number, default: 10000 },
    hasFutureDatedEvents: { type: Boolean, default: true }
  },

  // Section 4: Card Acceptance Methods (Must total 100%)
  cardAcceptanceMethods: {
    swipeContactlessInserted: { type: Number, default: 0, min: 0, max: 100 },
    mailOrderTelephoneOrder: { type: Number, default: 0, min: 0, max: 100 },
    ecommerce: { type: Number, default: 100, min: 0, max: 100 },
    subscriptionRecurring: { type: Number, default: 0, min: 0, max: 100 },
    posSystem: { type: String, default: 'OnStride' }
  },

  // Section 5: Additional Questionnaire
  additionalQuestionnaire: {
    businessConsumersPercent: { type: Number, default: 10, min: 0, max: 100 },
    individualCustomersPercent: { type: Number, default: 90, min: 0, max: 100 },
    ownsProductInventory: { type: Boolean, default: false },
    productStoredAtLocation: { type: Boolean, default: true },
    whoEntersCardInfo: {
      type: String,
      enum: ['merchant', 'consumer'],
      default: 'consumer'
    },
    whoShipsProduct: {
      type: String,
      enum: ['merchant', 'fulfillment_center', 'na'],
      default: 'na'
    },
    daysUntilShipAfterAuth: { type: Number, default: 0 }
  },

  // Section 6: Beneficial Owners (25%+ ownership) - Up to 4
  beneficialOwners: {
    type: [beneficialOwnerSchema],
    validate: [arr => arr.length <= 4, 'Maximum 4 beneficial owners allowed']
  },

  // Section 7: Controlling Person
  controllingPerson: controllingPersonSchema,

  // Section 8: Rates and Fees (Pre-set by OnStride - read only for merchant)
  ratesAndFees: {
    creditInterchangeRate: { type: Number, default: 0.80 },
    debitInterchangeRate: { type: Number, default: 0.80 },
    chargebackFee: { type: Number, default: 25.00 },
    retrievalRequestFee: { type: Number, default: 10.00 },
    authorizationFee: { type: Number, default: 0.10 },
    batchFee: { type: Number, default: 0.75 },
    statementFeeMonthly: { type: Number, default: 10.00 },
    pciDssFeeMonthly: { type: Number, default: 20.00 },
    acceptedCardTypes: {
      visa: { type: Boolean, default: true },
      mastercard: { type: Boolean, default: true },
      discover: { type: Boolean, default: true },
      amex: { type: Boolean, default: true },
      ach: { type: Boolean, default: true }
    }
  },

  // Section 9: Bank Account (Settlement)
  bankAccount: {
    accountType: {
      type: String,
      enum: ['checking', 'savings'],
      default: 'checking'
    },
    bankName: { type: String, trim: true },
    routingNumberEncrypted: { type: String, select: false },
    accountNumberEncrypted: { type: String, select: false },
    bankContactName: { type: String, trim: true },
    bankContactPhone: { type: String, trim: true },
    voidedCheckDocument: String // File reference
  },

  // Section 10: Signatures
  signatures: {
    merchantSignature: String, // Base64 or file reference
    merchantPrintedName: String,
    merchantSignatureDate: Date,
    merchantSignatureIp: String,

    principal1Signature: String,
    principal1PrintedName: String,
    principal1SignatureDate: Date,
    principal1SignatureIp: String,

    principal2Signature: String,
    principal2PrintedName: String,
    principal2SignatureDate: Date,
    principal2SignatureIp: String,

    termsAccepted: { type: Boolean, default: false },
    termsAcceptedDate: Date
  },

  // Section 11: Required Documents
  documents: {
    processingStatements: [String], // 3 months if applicable
    proofOfAddress: String,
    incorporationCert: String,
    voidedCheck: String,
    ownerIds: [String]
  },

  // Windcave Credentials (After Approval) - Legacy, kept for backward compatibility
  windcaveCredentials: {
    merchantId: String,
    apiKeyEncrypted: { type: String, select: false },
    apiSecretEncrypted: { type: String, select: false },
    isActive: { type: Boolean, default: false },
    activatedAt: Date,
    lastTestedAt: Date,
    testResult: {
      success: Boolean,
      message: String,
      testedAt: Date
    }
  },

  // Stripe Connect (Primary payment processor)
  stripeConnect: {
    accountId: String,                    // Stripe Connect account ID (acct_xxx)
    chargesEnabled: { type: Boolean, default: false },
    payoutsEnabled: { type: Boolean, default: false },
    detailsSubmitted: { type: Boolean, default: false },
    createdAt: Date,
    onboardingCompletedAt: Date,
    disconnectedAt: Date,                 // If barn disconnects their account
    previousAccountId: String,            // For audit trail if reconnected
  },

  // Audit trail
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: { type: Date, default: Date.now },
    details: String,
    ipAddress: String
  }]
}, {
  timestamps: true
});

// Indexes
merchantApplicationSchema.index({ barnId: 1 });
merchantApplicationSchema.index({ userId: 1 });
merchantApplicationSchema.index({ status: 1 });
merchantApplicationSchema.index({ 'windcaveCredentials.isActive': 1 });
merchantApplicationSchema.index({ 'stripeConnect.accountId': 1 });

// Pre-save middleware to encrypt sensitive fields
merchantApplicationSchema.pre('save', function(next) {
  // Encrypt EIN/TIN if modified
  if (this.isModified('merchantInfo.einTinEncrypted') && this.merchantInfo?.einTinEncrypted && !this.merchantInfo.einTinEncrypted.includes(':')) {
    this.merchantInfo.einTinEncrypted = encrypt(this.merchantInfo.einTinEncrypted);
  }

  // Encrypt bank routing number
  if (this.isModified('bankAccount.routingNumberEncrypted') && this.bankAccount?.routingNumberEncrypted && !this.bankAccount.routingNumberEncrypted.includes(':')) {
    this.bankAccount.routingNumberEncrypted = encrypt(this.bankAccount.routingNumberEncrypted);
  }

  // Encrypt bank account number
  if (this.isModified('bankAccount.accountNumberEncrypted') && this.bankAccount?.accountNumberEncrypted && !this.bankAccount.accountNumberEncrypted.includes(':')) {
    this.bankAccount.accountNumberEncrypted = encrypt(this.bankAccount.accountNumberEncrypted);
  }

  // Encrypt controlling person SSN
  if (this.isModified('controllingPerson.ssnEncrypted') && this.controllingPerson?.ssnEncrypted && !this.controllingPerson.ssnEncrypted.includes(':')) {
    this.controllingPerson.ssnEncrypted = encrypt(this.controllingPerson.ssnEncrypted);
  }

  // Encrypt controlling person driver's license
  if (this.isModified('controllingPerson.driversLicense.numberEncrypted') && this.controllingPerson?.driversLicense?.numberEncrypted && !this.controllingPerson.driversLicense.numberEncrypted.includes(':')) {
    this.controllingPerson.driversLicense.numberEncrypted = encrypt(this.controllingPerson.driversLicense.numberEncrypted);
  }

  // Encrypt Windcave credentials
  if (this.isModified('windcaveCredentials.apiKeyEncrypted') && this.windcaveCredentials?.apiKeyEncrypted && !this.windcaveCredentials.apiKeyEncrypted.includes(':')) {
    this.windcaveCredentials.apiKeyEncrypted = encrypt(this.windcaveCredentials.apiKeyEncrypted);
  }

  if (this.isModified('windcaveCredentials.apiSecretEncrypted') && this.windcaveCredentials?.apiSecretEncrypted && !this.windcaveCredentials.apiSecretEncrypted.includes(':')) {
    this.windcaveCredentials.apiSecretEncrypted = encrypt(this.windcaveCredentials.apiSecretEncrypted);
  }

  // Encrypt beneficial owners SSN and driver's license
  if (this.beneficialOwners) {
    this.beneficialOwners.forEach((owner, index) => {
      if (this.isModified(`beneficialOwners.${index}.ssnEncrypted`) && owner.ssnEncrypted && !owner.ssnEncrypted.includes(':')) {
        owner.ssnEncrypted = encrypt(owner.ssnEncrypted);
      }
      if (this.isModified(`beneficialOwners.${index}.driversLicense.numberEncrypted`) && owner.driversLicense?.numberEncrypted && !owner.driversLicense.numberEncrypted.includes(':')) {
        owner.driversLicense.numberEncrypted = encrypt(owner.driversLicense.numberEncrypted);
      }
    });
  }

  next();
});

// Method to get decrypted EIN/TIN
merchantApplicationSchema.methods.getEinTin = function() {
  if (!this.merchantInfo?.einTinEncrypted) return null;
  return decrypt(this.merchantInfo.einTinEncrypted);
};

// Method to get masked EIN/TIN for display
merchantApplicationSchema.methods.getMaskedEinTin = function() {
  const ein = this.getEinTin();
  return mask(ein, 4);
};

// Method to get decrypted bank account number
merchantApplicationSchema.methods.getBankAccountNumber = function() {
  if (!this.bankAccount?.accountNumberEncrypted) return null;
  return decrypt(this.bankAccount.accountNumberEncrypted);
};

// Method to get masked bank account number
merchantApplicationSchema.methods.getMaskedBankAccount = function() {
  const acct = this.getBankAccountNumber();
  return mask(acct, 4);
};

// Method to get decrypted Windcave credentials
merchantApplicationSchema.methods.getWindcaveCredentials = function() {
  if (!this.windcaveCredentials?.apiKeyEncrypted) return null;
  return {
    merchantId: this.windcaveCredentials.merchantId,
    apiKey: decrypt(this.windcaveCredentials.apiKeyEncrypted),
    apiSecret: decrypt(this.windcaveCredentials.apiSecretEncrypted)
  };
};

// Method to validate card acceptance methods total 100%
merchantApplicationSchema.methods.validateCardAcceptanceMethods = function() {
  const methods = this.cardAcceptanceMethods;
  const total = (methods.swipeContactlessInserted || 0) +
                (methods.mailOrderTelephoneOrder || 0) +
                (methods.ecommerce || 0) +
                (methods.subscriptionRecurring || 0);
  return total === 100;
};

// Method to validate customer percentages total 100%
merchantApplicationSchema.methods.validateCustomerPercentages = function() {
  const q = this.additionalQuestionnaire;
  const total = (q.businessConsumersPercent || 0) + (q.individualCustomersPercent || 0);
  return total === 100;
};

// Method to add audit log entry
merchantApplicationSchema.methods.addAuditLog = function(action, userId, details, ipAddress) {
  this.auditLog.push({
    action,
    performedBy: userId,
    timestamp: new Date(),
    details,
    ipAddress
  });
};

// Method to check if application is complete
merchantApplicationSchema.methods.isComplete = function() {
  // Check required sections
  const hasLegalName = !!this.merchantInfo?.legalName;
  const hasBusinessType = !!this.merchantInfo?.businessType;
  const hasLocationAddress = !!(this.merchantInfo?.locationAddress?.street &&
                                this.merchantInfo?.locationAddress?.city &&
                                this.merchantInfo?.locationAddress?.state &&
                                this.merchantInfo?.locationAddress?.zipCode);
  const hasControllingPerson = !!(this.controllingPerson?.firstName && this.controllingPerson?.lastName);
  const hasBankAccount = !!(this.bankAccount?.bankName &&
                            this.bankAccount?.routingNumberEncrypted &&
                            this.bankAccount?.accountNumberEncrypted);
  const hasSignature = !!this.signatures?.merchantSignature;
  const hasTermsAccepted = this.signatures?.termsAccepted === true;

  return hasLegalName && hasBusinessType && hasLocationAddress &&
         hasControllingPerson && hasBankAccount && hasSignature && hasTermsAccepted;
};

// Static method to get application by barn
merchantApplicationSchema.statics.findByBarn = function(barnId) {
  return this.findOne({ barnId });
};

// Static method to get active merchant (approved with valid credentials)
merchantApplicationSchema.statics.findActiveMerchant = function(barnId) {
  return this.findOne({
    barnId,
    status: 'approved',
    'windcaveCredentials.isActive': true
  });
};

const MerchantApplication = mongoose.model('MerchantApplication', merchantApplicationSchema);

module.exports = MerchantApplication;
