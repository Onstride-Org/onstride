const mongoose = require('mongoose');

// Document Template
const placeholderSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  label: String,
  type: {
    type: String,
    enum: ['text', 'date', 'number', 'signature', 'checkbox', 'textarea'],
    default: 'text'
  },
  required: {
    type: Boolean,
    default: false
  },
  defaultValue: String
}, { _id: false });

const documentTemplateSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn'
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['boardingAgreement', 'liabilityWaiver', 'leaseAgreement', 'billOfSale', 'trainingAgreement', 'lessonWaiver', 'emergencyContact', 'medicalAuth', 'custom'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  description: String,
  placeholders: [placeholderSchema],
  isSystemTemplate: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

documentTemplateSchema.index({ barnId: 1, type: 1 });
documentTemplateSchema.index({ isSystemTemplate: 1 });

const DocumentTemplate = mongoose.model('DocumentTemplate', documentTemplateSchema);

// Document Signature
const documentSignatureSchema = new mongoose.Schema({
  signerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  signerName: String,
  signerEmail: String,
  role: String,
  isSigned: {
    type: Boolean,
    default: false
  },
  signatureImageUrl: String,
  ipAddress: String,
  signedAt: Date
}, { _id: true });

// Generated Document
const generatedDocumentSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentTemplate',
    required: true
  },
  templateName: String,
  renderedContent: String,
  filledValues: mongoose.Schema.Types.Mixed,
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  clientName: String,
  horseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse'
  },
  horseName: String,
  status: {
    type: String,
    enum: ['draft', 'pendingSignature', 'partiallySigned', 'fullySigned', 'expired', 'cancelled'],
    default: 'draft'
  },
  signatures: [documentSignatureSchema],
  pdfUrl: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sentAt: Date,
  completedAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

generatedDocumentSchema.index({ barnId: 1, status: 1 });
generatedDocumentSchema.index({ clientId: 1 });
generatedDocumentSchema.index({ templateId: 1 });

const GeneratedDocument = mongoose.model('GeneratedDocument', generatedDocumentSchema);

module.exports = {
  DocumentTemplate,
  GeneratedDocument
};
