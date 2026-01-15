const mongoose = require('mongoose');

const trainerAvailabilitySchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  dayOfWeek: {
    type: Number, // 0-6 for Sunday-Saturday
    required: true,
    min: 0,
    max: 6
  },
  startTime: {
    type: String, // "09:00"
    required: true
  },
  endTime: {
    type: String, // "17:00"
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

trainerAvailabilitySchema.index({ trainerId: 1, barnId: 1, dayOfWeek: 1 });

const TrainerAvailability = mongoose.model('TrainerAvailability', trainerAvailabilitySchema);

module.exports = TrainerAvailability;
