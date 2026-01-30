# Windcave Payment Integration Implementation Plan

## Overview

This document outlines the implementation plan for integrating Windcave payment processing into OnStride. The integration allows barn owners to apply to become merchants, receive approval from Windcave, and process payments for invoices.

---

## Phase 1: Database Schema & Backend Foundation

### 1.1 MongoDB Schema - Merchant Application

```javascript
// models/MerchantApplication.js
const merchantApplicationSchema = new Schema({
  barnId: { type: Schema.Types.ObjectId, ref: 'Barn', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

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

  // Section 1: Merchant Information
  merchantInfo: {
    legalName: { type: String, required: true },
    tradingName: String, // DBA
    businessType: {
      type: String,
      enum: ['corporation', 'llc', 'sole_proprietor', 'partnership', 'nonprofit_501c3', 'government', 'publicly_traded']
    },
    tickerSymbol: String, // If publicly traded

    // Physical Location (No PO Box)
    locationAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },

    // Mailing Address
    postalAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      sameAsLocation: { type: Boolean, default: false }
    },

    // Contact
    email: String,
    phone: String,
    website: String,

    // Tax
    einTin: String // Encrypted
  },

  // Section 2: Business Description & Risk
  businessDescription: {
    description: { type: String, default: 'Equine boarding, training, and related services' },
    natureOfBusiness: {
      type: String,
      enum: ['administrative', 'arts_recreation', 'construction', 'education', 'financial_services',
             'food_services', 'health_care', 'hospitality_lodging', 'manufacturing', 'media',
             'parking_car_wash', 'retail', 'technical_services', 'utility_services', 'wholesale'],
      default: 'arts_recreation' // Horse barns typically fall under this
    },

    // Compliance History
    legalActionByRegulator: { type: Boolean, default: false },
    legalActionExplanation: String,
    finedByCardNetwork: { type: Boolean, default: false },
    fineExplanation: String
  },

  // Section 3: Transaction & Volume Details
  transactionDetails: {
    averageTicket: { type: Number, default: 500 }, // Average boarding invoice
    highTicket: { type: Number, default: 5000 },
    monthlyCardVolume: { type: Number, default: 10000 },
    hasFutureDatedEvents: { type: Boolean, default: true } // Bookings with deposits
  },

  // Section 4: Card Acceptance Methods (Must total 100%)
  cardAcceptanceMethods: {
    swipeContactlessInserted: { type: Number, default: 0 },
    mailOrderTelephoneOrder: { type: Number, default: 0 },
    ecommerce: { type: Number, default: 100 }, // OnStride is online
    subscriptionRecurring: { type: Number, default: 0 },
    posSystem: { type: String, default: 'OnStride' }
  },

  // Section 5: Additional Questionnaire (Pre-filled for equine business)
  additionalQuestionnaire: {
    businessConsumersPercent: { type: Number, default: 10 }, // B2B
    individualCustomersPercent: { type: Number, default: 90 }, // B2C
    ownsProductInventory: { type: Boolean, default: false }, // Horses owned by boarders
    productStoredAtLocation: { type: Boolean, default: true },
    whoEntersCardInfo: { type: String, enum: ['merchant', 'consumer'], default: 'consumer' },
    whoShipsProduct: { type: String, enum: ['merchant', 'fulfillment_center', 'na'], default: 'na' },
    daysUntilShipAfterAuth: { type: Number, default: 0 } // N/A for services
  },

  // Section 6: Beneficial Owners (25%+ ownership) - Up to 4
  beneficialOwners: [{
    firstName: String,
    lastName: String,
    title: String,
    percentOwnership: Number,
    homePhone: String,
    email: String,
    ssn: String, // Encrypted
    dateOfBirth: Date,
    driversLicense: {
      number: String, // Encrypted
      state: String
    },
    homeAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  }],

  // Section 7: Controlling Person (Required even if no 25% owners)
  controllingPerson: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    title: String,
    percentOwnership: Number,
    homePhone: String,
    email: String,
    ssn: String, // Encrypted
    dateOfBirth: Date,
    driversLicense: {
      number: String, // Encrypted
      state: String
    },
    homeAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  },

  // Section 8: Rates and Fees (Pre-set by OnStride)
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
    accountType: { type: String, enum: ['checking', 'savings'], default: 'checking' },
    bankName: String,
    routingNumber: String, // Encrypted
    accountNumber: String, // Encrypted
    bankContactName: String,
    bankContactPhone: String,
    voidedCheckDocument: String // File reference
  },

  // Section 10: Signatures
  signatures: {
    merchantSignature: String, // Base64 or file reference
    merchantPrintedName: String,
    merchantSignatureDate: Date,

    // Personal Guarantors
    principal1Signature: String,
    principal1PrintedName: String,
    principal1SignatureDate: Date,

    principal2Signature: String,
    principal2PrintedName: String,
    principal2SignatureDate: Date
  },

  // Section 11: Required Documents
  documents: {
    processingStatements: [String], // 3 months if applicable
    proofOfAddress: String, // Utility bill or bank statement
    incorporationCert: String, // Or W9 or 501c3
    voidedCheck: String, // Or bank letter
    ownerIds: [String] // Passport or gov ID for each 25%+ owner
  },

  // Windcave Credentials (After Approval)
  windcaveCredentials: {
    merchantId: String,
    apiKey: String, // Encrypted
    apiSecret: String, // Encrypted
    isActive: { type: Boolean, default: false },
    activatedAt: Date
  },

  // Audit
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### 1.2 API Routes

```javascript
// routes/windcave.js
router.post('/application', auth, createApplication);
router.get('/application', auth, getApplication);
router.put('/application', auth, updateApplication);
router.post('/application/submit', auth, submitApplication);
router.post('/application/documents', auth, upload, uploadDocument);
router.delete('/application/documents/:docId', auth, deleteDocument);
router.post('/credentials', auth, saveCredentials);
router.get('/credentials/status', auth, getCredentialStatus);
router.post('/test-connection', auth, testWindcaveConnection);
```

---

## Phase 2: Frontend - Payments Tab UI

### 2.1 Update FinancialsPage PaymentsTab

The Payments tab will show different states based on merchant application status:

#### State 1: No Application Started
- Show "Enable Billing" card with benefits
- CTA button to start application

#### State 2: Application In Progress (Draft)
- Show application progress stepper
- Allow user to continue editing
- Show which sections are complete

#### State 3: Application Submitted
- Show "Under Review" status
- Display submitted date
- Show expected timeline

#### State 4: Approved - Awaiting Credentials
- Show approval message
- Form to enter Windcave API credentials (received via email)
- Instructions on where to find credentials

#### State 5: Active - Processing Enabled
- Show active status with green indicator
- Display merchant ID
- Show transaction summary
- Link to Windcave dashboard

### 2.2 Merchant Application Wizard

Multi-step wizard with the following sections:

```
Step 1: Business Information
  - Legal name, trading name
  - Business type
  - Addresses
  - Contact info
  - Tax ID

Step 2: Business Details
  - Description of services (pre-filled)
  - Nature of business (pre-filled: Arts & Recreation)
  - Compliance questions

Step 3: Transaction Details
  - Average/High ticket amounts
  - Monthly volume estimate
  - Future-dated events question

Step 4: Card Acceptance
  - Methods breakdown (pre-filled for e-commerce)
  - Additional questionnaire (mostly pre-filled)

Step 5: Ownership Information
  - Beneficial owners (25%+)
  - Controlling person

Step 6: Bank Account
  - Settlement account details
  - Upload voided check

Step 7: Documents
  - Upload required documents
  - Document checklist

Step 8: Review & Sign
  - Review all information
  - Electronic signatures
  - Terms acceptance
  - Submit
```

### 2.3 Component Structure

```
/pages/financials/
  FinancialsPage.tsx (existing - update PaymentsTab)

/components/windcave/
  WindcaveApplicationWizard.tsx
  WindcaveStatusCard.tsx
  WindcaveCredentialsForm.tsx

  /steps/
    BusinessInfoStep.tsx
    BusinessDetailsStep.tsx
    TransactionDetailsStep.tsx
    CardAcceptanceStep.tsx
    OwnershipInfoStep.tsx
    BankAccountStep.tsx
    DocumentsStep.tsx
    ReviewSignStep.tsx

  /components/
    SignaturePad.tsx
    DocumentUploader.tsx
    AddressForm.tsx
    OwnerForm.tsx
```

---

## Phase 3: Pre-fill Logic

### 3.1 Data Sources for Pre-filling

From existing OnStride data:
- **Barn Settings**: Legal name, trading name, address, phone, email, website
- **User Profile**: Owner name, email, phone for controlling person
- **Business Type**: Default to appropriate category

### 3.2 Pre-filled Values (Equine Business Defaults)

```javascript
const EQUINE_DEFAULTS = {
  businessDescription: 'Equine boarding, training, lessons, and related services',
  natureOfBusiness: 'arts_recreation',

  // Card Acceptance (100% e-commerce via OnStride)
  cardAcceptanceMethods: {
    swipeContactlessInserted: 0,
    mailOrderTelephoneOrder: 0,
    ecommerce: 100,
    subscriptionRecurring: 0,
    posSystem: 'OnStride'
  },

  // Questionnaire
  additionalQuestionnaire: {
    businessConsumersPercent: 10,
    individualCustomersPercent: 90,
    ownsProductInventory: false,
    productStoredAtLocation: true,
    whoEntersCardInfo: 'consumer',
    whoShipsProduct: 'na',
    daysUntilShipAfterAuth: 0
  },

  // Transaction estimates (can be adjusted)
  transactionDetails: {
    averageTicket: 500,
    highTicket: 5000,
    monthlyCardVolume: 10000,
    hasFutureDatedEvents: true
  },

  // Rates (set by OnStride partnership)
  ratesAndFees: {
    // These are preset by OnStride's agreement with Windcave
    // Merchant sees but cannot change
  }
};
```

---

## Phase 4: Document Handling

### 4.1 Required Documents Checklist

1. **Processing Statements** (if applicable) - 3 months
2. **Proof of Address** - Utility bill or bank statement with legal name
3. **Incorporation Document** - One of:
   - Certificate of Incorporation/Registration
   - W-9
   - 501(c)(3) Letter
4. **Voided Check** - Or bank letter
5. **Owner IDs** - For each 25%+ owner:
   - Passport OR
   - Government-issued ID

### 4.2 Document Upload Component

```javascript
// Features:
- Drag & drop upload
- File type validation (PDF, PNG, JPG)
- Max file size: 10MB
- Preview functionality
- Secure storage (S3 or similar)
- Document status tracking
```

---

## Phase 5: Electronic Signature

### 5.1 Signature Implementation

Use a canvas-based signature pad for:
- Merchant signature
- Principal #1 signature (if applicable)
- Principal #2 signature (if applicable)

### 5.2 Legal Compliance

- Timestamp all signatures
- Store IP address
- Generate audit trail
- Include terms and conditions acceptance

---

## Phase 6: Windcave API Integration

### 6.1 After Approval Flow

1. Windcave emails merchant with credentials
2. Merchant enters credentials in OnStride
3. OnStride validates credentials via test API call
4. If valid, store encrypted credentials
5. Enable payment processing for barn

### 6.2 Credential Storage

```javascript
// Encrypt sensitive data
const encryptedCredentials = {
  merchantId: encrypt(merchantId),
  apiKey: encrypt(apiKey),
  apiSecret: encrypt(apiSecret)
};
```

### 6.3 Payment Processing Integration

Update invoice payment flow:
1. When boarder pays invoice
2. Use barn's Windcave credentials
3. Process payment via Windcave API
4. Funds settle to merchant's bank account
5. Update invoice status

---

## Phase 7: Implementation Order

### Sprint 1: Backend Foundation
- [ ] Create MerchantApplication model
- [ ] Create API routes
- [ ] Set up document storage
- [ ] Implement encryption for sensitive fields

### Sprint 2: Basic UI
- [ ] Update PaymentsTab with status states
- [ ] Create WindcaveStatusCard component
- [ ] Create application wizard shell

### Sprint 3: Application Wizard Steps 1-4
- [ ] BusinessInfoStep
- [ ] BusinessDetailsStep
- [ ] TransactionDetailsStep
- [ ] CardAcceptanceStep

### Sprint 4: Application Wizard Steps 5-8
- [ ] OwnershipInfoStep
- [ ] BankAccountStep
- [ ] DocumentsStep (with upload)
- [ ] ReviewSignStep (with signatures)

### Sprint 5: Submission & Credentials
- [ ] Application submission flow
- [ ] Status tracking
- [ ] Credentials entry form
- [ ] Test connection functionality

### Sprint 6: Payment Integration
- [ ] Integrate Windcave payment API
- [ ] Update invoice payment flow
- [ ] Transaction history
- [ ] Settlement tracking

---

## Phase 8: Security Considerations

### 8.1 Data Encryption
- SSN, EIN, bank account numbers encrypted at rest
- TLS for all API communications
- PCI-DSS compliance for card data

### 8.2 Access Control
- Only barn owners can manage merchant application
- Audit logging for all sensitive operations
- Session management for long forms

### 8.3 Document Security
- Secure document storage
- Signed URLs for document access
- Auto-expiring links

---

## API Reference

### Windcave Developer Documentation
- Main docs: https://www.windcave.com/developer-documentation
- API Reference: https://www.windcave.com/developer-e-commerce-api-rest

### Key Endpoints (Post-Approval)
- Authorization: POST /v1/transactions
- Capture: PUT /v1/transactions/{id}
- Refund: POST /v1/transactions/{id}/refunds
- Query: GET /v1/transactions/{id}

---

## Notes

1. **Application PDF**: The system will generate a PDF matching the Windcave application format for submission
2. **Rates**: All merchants get the same pre-negotiated rates through OnStride's partnership
3. **Support**: OnStride support handles merchant onboarding questions, Windcave handles approval
4. **Timeline**: Typical approval takes 3-5 business days after complete submission
