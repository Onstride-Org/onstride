const mongoose = require('mongoose');

// Breeding Suggestion
const breedingFactorSchema = new mongoose.Schema({
  category: String,
  description: String,
  impact: String,
  severity: {
    type: String,
    enum: ['info', 'positive', 'caution', 'warning', 'critical']
  }
}, { _id: false });

const colorPredictionSchema = new mongoose.Schema({
  color: String,
  probability: Number
}, { _id: false });

const disciplineSuitabilitySchema = new mongoose.Schema({
  discipline: String,
  suitabilityScore: Number
}, { _id: false });

const geneticWarningSchema = new mongoose.Schema({
  condition: String,
  description: String,
  riskLevel: {
    type: String,
    enum: ['none', 'low', 'moderate', 'high', 'critical']
  },
  mareStatus: String,
  stallionStatus: String,
  offspringProbabilities: mongoose.Schema.Types.Mixed
}, { _id: false });

const breedingSuggestionSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  mareId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse',
    required: true
  },
  stallionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse',
    required: true
  },
  mareName: String,
  stallionName: String,
  mareBreed: String,
  stallionBreed: String,
  overallCompatibilityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  positiveFactors: [breedingFactorSchema],
  negativeFactors: [breedingFactorSchema],
  neutralFactors: [breedingFactorSchema],
  offspringPrediction: {
    possibleColors: [colorPredictionSchema],
    estimatedHeightRange: {
      min: Number,
      max: Number
    },
    disciplineSuitability: [disciplineSuitabilitySchema],
    temperamentTendencies: [String],
    healthConsiderations: [String]
  },
  geneticWarnings: [geneticWarningSchema],
  isReviewed: {
    type: Boolean,
    default: false
  },
  userNotes: String,
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

breedingSuggestionSchema.index({ barnId: 1, createdAt: -1 });
breedingSuggestionSchema.index({ mareId: 1 });
breedingSuggestionSchema.index({ stallionId: 1 });

const BreedingSuggestion = mongoose.model('BreedingSuggestion', breedingSuggestionSchema);

// Scheduling Suggestion
const schedulingSuggestionSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  type: {
    type: String,
    enum: ['lessonTime', 'horseRest', 'trainerBalance', 'arenaOptimization', 'conflictResolution'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: String,
  description: String,
  suggestedStartTime: Date,
  suggestedEndTime: Date,
  horseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse'
  },
  horseName: String,
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  trainerName: String,
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  clientName: String,
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolution: String,
  resolvedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date
}, {
  timestamps: true
});

schedulingSuggestionSchema.index({ barnId: 1, isResolved: 1, createdAt: -1 });
schedulingSuggestionSchema.index({ priority: 1 });

const SchedulingSuggestion = mongoose.model('SchedulingSuggestion', schedulingSuggestionSchema);

// Scanned Document
const scannedDocumentSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalFileUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'needsReview'],
    default: 'pending'
  },
  detectedType: {
    type: String,
    enum: ['coggins', 'healthCertificate', 'registration', 'vaccination', 'importExport', 'brandInspection', 'other', 'unknown']
  },
  detectedTypeConfidence: Number,
  extractedText: String,
  extractedHorseName: String,
  extractedOwnerName: String,
  extractedDate: Date,
  extractedExpirationDate: Date,
  extractedVetName: String,
  suggestedHorseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse'
  },
  confirmedHorseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse'
  },
  userConfirmedType: String,
  userConfirmedHorse: {
    type: Boolean,
    default: false
  },
  createdDocumentId: {
    type: mongoose.Schema.Types.ObjectId
  },
  errorMessage: String
}, {
  timestamps: true
});

scannedDocumentSchema.index({ barnId: 1, status: 1 });
scannedDocumentSchema.index({ uploadedBy: 1 });

const ScannedDocument = mongoose.model('ScannedDocument', scannedDocumentSchema);

// Horse Workload Analysis (computed/cached)
const horseWorkloadSchema = new mongoose.Schema({
  horseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse',
    required: true,
    unique: true
  },
  horseName: String,
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn'
  },
  ridesLast7Days: {
    type: Number,
    default: 0
  },
  totalMinutesLast7Days: {
    type: Number,
    default: 0
  },
  avgDailyMinutes: {
    type: Number,
    default: 0
  },
  recommendedMaxDailyMinutes: {
    type: Number,
    default: 120
  },
  daysSinceRest: {
    type: Number,
    default: 0
  },
  recommendedRestFrequency: {
    type: Number,
    default: 7
  },
  needsRest: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['underworked', 'normal', 'heavy', 'overworked'],
    default: 'normal'
  },
  lastCalculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

horseWorkloadSchema.index({ barnId: 1 });
horseWorkloadSchema.index({ status: 1 });

const HorseWorkload = mongoose.model('HorseWorkload', horseWorkloadSchema);

module.exports = {
  BreedingSuggestion,
  SchedulingSuggestion,
  ScannedDocument,
  HorseWorkload
};
