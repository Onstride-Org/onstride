const mongoose = require('mongoose');

// Subscription Plan (static data, can be seeded)
const subscriptionPlanSchema = new mongoose.Schema({
  tier: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  monthlyPriceCents: {
    type: Number,
    default: 0
  },
  yearlyPriceCents: {
    type: Number,
    default: 0
  },
  stripePriceIdMonthly: String,
  stripePriceIdYearly: String,

  // Limits
  maxHorses: {
    type: Number,
    default: -1 // -1 = unlimited
  },
  maxUsers: {
    type: Number,
    default: -1
  },
  maxLessonsPerMonth: {
    type: Number,
    default: -1
  },
  maxBarns: {
    type: Number,
    default: 1
  },

  // Features
  hasBilling: {
    type: Boolean,
    default: false
  },
  hasFullBilling: {
    type: Boolean,
    default: false
  },
  hasAiFeatures: {
    type: Boolean,
    default: false
  },
  hasMultiBarn: {
    type: Boolean,
    default: false
  },
  hasBranding: {
    type: Boolean,
    default: false
  },
  hasApiAccess: {
    type: Boolean,
    default: false
  },
  hasPrioritySupport: {
    type: Boolean,
    default: false
  },
  hasDedicatedSupport: {
    type: Boolean,
    default: false
  },

  isPopular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

// Barn Subscription
const barnSubscriptionSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true,
    unique: true
  },
  tier: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'trialing', 'pastDue', 'canceled', 'expired'],
    default: 'active'
  },
  billingInterval: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  trialEndsAt: Date,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  canceledAt: Date,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },

  // Current usage
  currentHorseCount: {
    type: Number,
    default: 0
  },
  currentUserCount: {
    type: Number,
    default: 0
  },
  currentMonthLessonCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

barnSubscriptionSchema.index({ barnId: 1 });
barnSubscriptionSchema.index({ status: 1 });

// Check if subscription has access to a feature
barnSubscriptionSchema.methods.hasFeature = async function(featureName) {
  const plan = await SubscriptionPlan.findOne({ tier: this.tier });
  if (!plan) return false;
  return plan[featureName] === true;
};

// Check if within limits
barnSubscriptionSchema.methods.canAdd = async function(resourceType) {
  const plan = await SubscriptionPlan.findOne({ tier: this.tier });
  if (!plan) return false;

  switch (resourceType) {
    case 'horse':
      return plan.maxHorses === -1 || this.currentHorseCount < plan.maxHorses;
    case 'user':
      return plan.maxUsers === -1 || this.currentUserCount < plan.maxUsers;
    case 'lesson':
      return plan.maxLessonsPerMonth === -1 || this.currentMonthLessonCount < plan.maxLessonsPerMonth;
    default:
      return true;
  }
};

const BarnSubscription = mongoose.model('BarnSubscription', barnSubscriptionSchema);

// Usage Metrics
const usageMetricsSchema = new mongoose.Schema({
  barnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barn',
    required: true
  },
  periodId: {
    type: String, // "2024-01"
    required: true
  },
  horseCount: {
    type: Number,
    default: 0
  },
  userCount: {
    type: Number,
    default: 0
  },
  lessonCount: {
    type: Number,
    default: 0
  },
  taskCount: {
    type: Number,
    default: 0
  },
  invoiceCount: {
    type: Number,
    default: 0
  },
  documentCount: {
    type: Number,
    default: 0
  },
  activeUsersCount: {
    type: Number,
    default: 0
  },
  rideLogsCount: {
    type: Number,
    default: 0
  },
  aiFeatureUsageCount: {
    type: Number,
    default: 0
  },
  storageUsedBytes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

usageMetricsSchema.index({ barnId: 1, periodId: 1 }, { unique: true });

const UsageMetrics = mongoose.model('UsageMetrics', usageMetricsSchema);

module.exports = {
  SubscriptionPlan,
  BarnSubscription,
  UsageMetrics
};
