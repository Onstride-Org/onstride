const mongoose = require('mongoose');

const vendorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  primaryType: {
    type: String,
    enum: ['vet', 'farrier', 'dentist', 'bodyworker', 'trainer', 'supplier', 'transport', 'photographer', 'other'],
    required: true
  },
  additionalTypes: [{
    type: String,
    enum: ['vet', 'farrier', 'dentist', 'bodyworker', 'trainer', 'supplier', 'transport', 'photographer', 'other']
  }],
  description: String,
  businessEmail: String,
  businessPhone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  serviceArea: String,
  website: String,
  photoUrl: String,
  licenseNumber: String,
  insuranceInfo: String,
  acceptingNewClients: {
    type: Boolean,
    default: true
  },
  emergencyAvailable: {
    type: Boolean,
    default: false
  },
  responseTime: String,
  paymentMethods: [String],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

vendorProfileSchema.index({ primaryType: 1 });
vendorProfileSchema.index({ city: 1, state: 1 });
vendorProfileSchema.index({ rating: -1 });

const VendorProfile = mongoose.model('VendorProfile', vendorProfileSchema);

// Barn-Vendor Connection
const barnVendorSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile',
    required: true
  },
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  status: {
    type: String,
    enum: ['pendingVendor', 'pendingBarn', 'active', 'suspended', 'inactive'],
    default: 'pendingBarn'
  },
  services: [{
    type: String
  }],
  notes: String,
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

barnVendorSchema.index({ vendorId: 1, barnId: 1 }, { unique: true });
barnVendorSchema.index({ barnId: 1, status: 1 });

const BarnVendor = mongoose.model('BarnVendor', barnVendorSchema);

// Vendor Appointment
const vendorAppointmentSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile',
    required: true
  },
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  horseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse'
  },
  horseName: String,
  scheduledDate: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 60
  },
  status: {
    type: String,
    enum: ['requested', 'confirmed', 'inProgress', 'completed', 'cancelled', 'noShow'],
    default: 'requested'
  },
  type: String,
  price: Number,
  notes: String,
  completionNotes: String,
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

vendorAppointmentSchema.index({ vendorId: 1, scheduledDate: 1 });
vendorAppointmentSchema.index({ barnId: 1, scheduledDate: 1 });
vendorAppointmentSchema.index({ horseId: 1 });
vendorAppointmentSchema.index({ status: 1 });

const VendorAppointment = mongoose.model('VendorAppointment', vendorAppointmentSchema);

module.exports = {
  VendorProfile,
  BarnVendor,
  VendorAppointment
};
