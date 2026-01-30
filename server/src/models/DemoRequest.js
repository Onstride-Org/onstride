const mongoose = require('mongoose');

const demoRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  barnName: {
    type: String,
    trim: true
  },
  discipline: {
    type: String,
    trim: true
  },
  horseCount: {
    type: String,
    trim: true
  },
  isDecisionMaker: {
    type: String,
    enum: ['yes', 'no', ''],
    default: ''
  },
  selectedDate: {
    type: String
  },
  selectedTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'scheduled', 'completed', 'cancelled'],
    default: 'new'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DemoRequest', demoRequestSchema);
