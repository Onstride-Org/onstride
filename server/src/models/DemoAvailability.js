const mongoose = require('mongoose');

const demoAvailabilitySchema = new mongoose.Schema({
  // Day of week: 0 = Sunday, 1 = Monday, etc.
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  // Time slots available for this day
  timeSlots: [{
    time: {
      type: String, // e.g., "9:00 AM", "10:00 AM"
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  // Whether this day is enabled at all
  isEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
demoAvailabilitySchema.index({ dayOfWeek: 1 });

module.exports = mongoose.model('DemoAvailability', demoAvailabilitySchema);
