const mongoose = require('mongoose');

const layoutElementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['stall', 'arena', 'pasture', 'washRack', 'tackRoom', 'feedRoom', 'office', 'bathroom', 'storage', 'custom'],
    required: true
  },
  label: String,
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  rotation: {
    type: Number,
    default: 0
  },
  fillColor: {
    type: String,
    default: '#E6E6E6'
  },
  borderColor: {
    type: String,
    default: '#BCBCBC'
  },
  borderWidth: {
    type: Number,
    default: 1
  },
  cornerRadius: {
    type: Number,
    default: 4
  },
  assignedHorseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse'
  },
  assignedHorseName: String,
  capacity: {
    type: Number,
    default: 1
  },
  currentOccupancy: {
    type: Number,
    default: 0
  },
  zIndex: {
    type: Number,
    default: 0
  },
  properties: mongoose.Schema.Types.Mixed
}, { _id: true });

const barnLayoutSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Main Layout'
  },
  canvasWidth: {
    type: Number,
    default: 1200
  },
  canvasHeight: {
    type: Number,
    default: 800
  },
  elements: [layoutElementSchema],
  defaultZoom: {
    type: Number,
    default: 1
  },
  showLabels: {
    type: Boolean,
    default: true
  },
  showHorseNames: {
    type: Boolean,
    default: true
  },
  backgroundColor: {
    type: String,
    default: '#F5F5F5'
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

barnLayoutSchema.index({ barnId: 1 });

const BarnLayout = mongoose.model('BarnLayout', barnLayoutSchema);

module.exports = BarnLayout;
