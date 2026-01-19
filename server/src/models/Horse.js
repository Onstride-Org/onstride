const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['temperature', 'weight', 'vaccination', 'deworming', 'dental', 'farrier', 'veterinary', 'medication', 'injury', 'geneticTest', 'other'],
    default: 'other'
  },
  title: String,
  value: String, // For temperature: "101.5°F", for weight: "1100 lbs", etc.
  date: {
    type: Date,
    default: Date.now
  },
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Legacy fields for backward compatibility with genetic tests
  testName: String,
  result: String,
  testDate: Date,
  laboratory: String
}, { _id: true });

const horseDocumentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['coggins', 'healthCertificate', 'registration', 'vaccination', 'importExport', 'brandInspection', 'other'],
    required: true
  },
  name: String,
  fileUrl: String,
  expirationDate: Date,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

const horseSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: Number,
  birthday: {
    type: Date,
    default: () => {
      // Default to January 1st of current year
      const now = new Date();
      return new Date(now.getFullYear(), 0, 1);
    }
  },
  breed: {
    value: String,
    label: String
  },
  sexStatus: {
    value: String,
    label: String
  },
  color: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // Notes/details about the horse
  notes: {
    type: String,
    default: ''
  },
  // Owner/responsible user for the horse (who pays/is responsible)
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  boarderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Breeding Info
  usefNumber: String,
  feiNumber: String,
  registeredName: String,
  sireName: String,
  sireId: String,
  damName: String,
  damId: String,
  paternalGrandsireName: String,
  paternalGranddamName: String,
  maternalGrandsireName: String,
  maternalGranddamName: String,
  isStud: {
    type: Boolean,
    default: false
  },
  isBroodmare: {
    type: Boolean,
    default: false
  },
  colorGenetics: String,

  // Health Records (includes genetic tests, temperatures, etc.)
  healthRecords: [healthRecordSchema],
  // Legacy: keep geneticTests for backward compatibility
  geneticTests: [healthRecordSchema],

  // Documents
  documents: [horseDocumentSchema],

  // Stride Number
  strideNumber: String,
  strideNumberAssignedAt: Date,

  // Soft delete
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletionReason: String
}, {
  timestamps: true
});

horseSchema.index({ barnId: 1, deletedAt: 1 });
horseSchema.index({ boarderId: 1, deletedAt: 1 });
horseSchema.index({ strideNumber: 1 });

// Auto-calculate age from birthday
horseSchema.virtual('calculatedAge').get(function() {
  if (!this.birthday) return this.age;
  const today = new Date();
  const birthDate = new Date(this.birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Get horse summary
horseSchema.methods.toSummary = function() {
  return {
    id: this._id,
    name: this.name,
    boarderId: this.boarderId
  };
};

// Exclude soft-deleted horses by default
horseSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ deletedAt: null });
  next();
});

horseSchema.set('toJSON', { virtuals: true });
horseSchema.set('toObject', { virtuals: true });

const Horse = mongoose.model('Horse', horseSchema);

module.exports = Horse;
