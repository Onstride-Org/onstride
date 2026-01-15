const mongoose = require('mongoose');

const rideLogSchema = new mongoose.Schema({
  horseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse',
    required: true
  },
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['lesson', 'training', 'trail', 'lunging', 'groundwork', 'competition', 'other'],
    default: 'other'
  },
  durationMinutes: {
    type: Number,
    required: true
  },
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  riderName: String,
  notes: String,
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

rideLogSchema.index({ horseId: 1, date: -1 });
rideLogSchema.index({ barnId: 1, date: -1 });
rideLogSchema.index({ riderId: 1, date: -1 });
rideLogSchema.index({ deletedAt: 1 });

// Exclude soft-deleted ride logs by default
rideLogSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ deletedAt: null });
  next();
});

// Static method to get ride stats for a horse
rideLogSchema.statics.getStatsForHorse = async function(horseId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [allTimeStats, monthStats, weekStats] = await Promise.all([
    this.aggregate([
      { $match: { horseId: new mongoose.Types.ObjectId(horseId), deletedAt: null } },
      { $group: {
        _id: null,
        totalRides: { $sum: 1 },
        totalMinutes: { $sum: '$durationMinutes' }
      }}
    ]),
    this.aggregate([
      { $match: {
        horseId: new mongoose.Types.ObjectId(horseId),
        deletedAt: null,
        date: { $gte: startOfMonth }
      }},
      { $group: {
        _id: null,
        ridesThisMonth: { $sum: 1 },
        minutesThisMonth: { $sum: '$durationMinutes' }
      }}
    ]),
    this.aggregate([
      { $match: {
        horseId: new mongoose.Types.ObjectId(horseId),
        deletedAt: null,
        date: { $gte: startOfWeek }
      }},
      { $group: {
        _id: null,
        ridesThisWeek: { $sum: 1 },
        minutesThisWeek: { $sum: '$durationMinutes' }
      }}
    ])
  ]);

  return {
    totalRides: allTimeStats[0]?.totalRides || 0,
    totalMinutes: allTimeStats[0]?.totalMinutes || 0,
    ridesThisMonth: monthStats[0]?.ridesThisMonth || 0,
    minutesThisMonth: monthStats[0]?.minutesThisMonth || 0,
    ridesThisWeek: weekStats[0]?.ridesThisWeek || 0,
    minutesThisWeek: weekStats[0]?.minutesThisWeek || 0
  };
};

const RideLog = mongoose.model('RideLog', rideLogSchema);

module.exports = RideLog;
