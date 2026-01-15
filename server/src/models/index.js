const User = require('./User');
const Barn = require('./Barn');
const Horse = require('./Horse');
const Invoice = require('./Invoice');
const Task = require('./Task');
const Lesson = require('./Lesson');
const TrainerAvailability = require('./TrainerAvailability');
const RideLog = require('./RideLog');
const Invitation = require('./Invitation');
const BillingPeriod = require('./BillingPeriod');
const BillingTemplate = require('./BillingTemplate');
const { VendorProfile, BarnVendor, VendorAppointment } = require('./Vendor');
const UserBarnRole = require('./UserBarnRole');
const HorseTransfer = require('./HorseTransfer');
const { SubscriptionPlan, BarnSubscription, UsageMetrics } = require('./Subscription');
const { NotificationPreferences, Notification, DeviceToken } = require('./Notification');
const BarnBranding = require('./BarnBranding');
const BarnLayout = require('./BarnLayout');
const { BreedingSuggestion, SchedulingSuggestion, ScannedDocument, HorseWorkload } = require('./AI');
const { DocumentTemplate, GeneratedDocument } = require('./Document');

module.exports = {
  User,
  Barn,
  Horse,
  Invoice,
  Task,
  Lesson,
  TrainerAvailability,
  RideLog,
  Invitation,
  BillingPeriod,
  BillingTemplate,
  VendorProfile,
  BarnVendor,
  VendorAppointment,
  UserBarnRole,
  HorseTransfer,
  SubscriptionPlan,
  BarnSubscription,
  UsageMetrics,
  NotificationPreferences,
  Notification,
  DeviceToken,
  BarnBranding,
  BarnLayout,
  BreedingSuggestion,
  SchedulingSuggestion,
  ScannedDocument,
  HorseWorkload,
  DocumentTemplate,
  GeneratedDocument
};
