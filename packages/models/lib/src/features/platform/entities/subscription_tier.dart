import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'subscription_tier.freezed.dart';
part 'subscription_tier.g.dart';

/// Available subscription tiers
enum SubscriptionTier {
  free,
  basic,
  pro,
  enterprise,
}

/// Billing interval for subscriptions
enum BillingInterval {
  monthly,
  yearly,
}

/// Subscription status
enum SubscriptionStatus {
  active,
  trialing,
  pastDue,
  canceled,
  expired,
}

/// Subscription plan configuration with limits and features
@freezed
sealed class SubscriptionPlan with _$SubscriptionPlan {
  const factory SubscriptionPlan({
    required String id,
    required SubscriptionTier tier,
    required String name,
    required String description,

    /// Pricing
    @Default(0) int monthlyPriceCents,
    @Default(0) int yearlyPriceCents,
    String? stripePriceIdMonthly,
    String? stripePriceIdYearly,

    /// Limits
    @Default(5) int maxHorses,
    @Default(3) int maxUsers,
    @Default(10) int maxLessonsPerMonth,
    @Default(1) int maxBarns,

    /// Feature flags
    @Default(false) bool hasBilling,
    @Default(false) bool hasFullBilling,
    @Default(false) bool hasAiFeatures,
    @Default(false) bool hasMultiBarn,
    @Default(false) bool hasBranding,
    @Default(false) bool hasApiAccess,
    @Default(false) bool hasPrioritySupport,
    @Default(false) bool hasDedicatedSupport,

    /// Display
    @Default(false) bool isPopular,
    @Default(true) bool isActive,
    int? sortOrder,
  }) = _SubscriptionPlan;

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) =>
      _$SubscriptionPlanFromJson(json);

  /// Default plans
  static List<SubscriptionPlan> get defaultPlans => [
        const SubscriptionPlan(
          id: 'free',
          tier: SubscriptionTier.free,
          name: 'Free',
          description: 'Perfect for getting started',
          maxHorses: 5,
          maxUsers: 3,
          maxLessonsPerMonth: 10,
          maxBarns: 1,
          sortOrder: 0,
        ),
        const SubscriptionPlan(
          id: 'basic',
          tier: SubscriptionTier.basic,
          name: 'Basic',
          description: 'For small barns',
          monthlyPriceCents: 2900,
          yearlyPriceCents: 29000,
          maxHorses: 25,
          maxUsers: 10,
          maxLessonsPerMonth: 100,
          maxBarns: 1,
          hasBilling: true,
          sortOrder: 1,
        ),
        const SubscriptionPlan(
          id: 'pro',
          tier: SubscriptionTier.pro,
          name: 'Pro',
          description: 'For growing operations',
          monthlyPriceCents: 7900,
          yearlyPriceCents: 79000,
          maxHorses: 100,
          maxUsers: 50,
          maxLessonsPerMonth: -1, // Unlimited
          maxBarns: 3,
          hasBilling: true,
          hasFullBilling: true,
          hasAiFeatures: true,
          hasMultiBarn: true,
          hasPrioritySupport: true,
          isPopular: true,
          sortOrder: 2,
        ),
        const SubscriptionPlan(
          id: 'enterprise',
          tier: SubscriptionTier.enterprise,
          name: 'Enterprise',
          description: 'For large organizations',
          monthlyPriceCents: 19900,
          yearlyPriceCents: 199000,
          maxHorses: -1, // Unlimited
          maxUsers: -1, // Unlimited
          maxLessonsPerMonth: -1, // Unlimited
          maxBarns: -1, // Unlimited
          hasBilling: true,
          hasFullBilling: true,
          hasAiFeatures: true,
          hasMultiBarn: true,
          hasBranding: true,
          hasApiAccess: true,
          hasPrioritySupport: true,
          hasDedicatedSupport: true,
          sortOrder: 3,
        ),
      ];
}

/// A barn's subscription
@freezed
sealed class BarnSubscription with _$BarnSubscription {
  const factory BarnSubscription({
    required String id,
    required String barnId,
    required SubscriptionTier tier,
    required SubscriptionStatus status,
    required BillingInterval billingInterval,

    /// Stripe IDs
    String? stripeCustomerId,
    String? stripeSubscriptionId,

    /// Dates
    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? trialEndsAt,
    @NullableTimestampConverter() DateTime? currentPeriodStart,
    @NullableTimestampConverter() DateTime? currentPeriodEnd,
    @NullableTimestampConverter() DateTime? canceledAt,
    @NullableTimestampConverter() DateTime? cancelAtPeriodEnd,

    /// Usage tracking
    @Default(0) int currentHorseCount,
    @Default(0) int currentUserCount,
    @Default(0) int currentMonthLessonCount,
    @Default(0) int currentBarnCount,
  }) = _BarnSubscription;

  factory BarnSubscription.fromJson(Map<String, dynamic> json) =>
      _$BarnSubscriptionFromJson(json);
}

/// Usage metrics for a barn
@freezed
sealed class UsageMetrics with _$UsageMetrics {
  const factory UsageMetrics({
    required String barnId,
    required String periodId, // YYYY-MM format

    /// Counts
    @Default(0) int horseCount,
    @Default(0) int userCount,
    @Default(0) int lessonCount,
    @Default(0) int taskCount,
    @Default(0) int invoiceCount,
    @Default(0) int documentCount,

    /// Activity metrics
    @Default(0) int activeUsersCount,
    @Default(0) int rideLogsCount,
    @Default(0) int aiFeatureUsageCount,

    /// Storage
    @Default(0) int storageUsedBytes,

    @TimestampConverter() required DateTime updatedAt,
  }) = _UsageMetrics;

  factory UsageMetrics.fromJson(Map<String, dynamic> json) =>
      _$UsageMetricsFromJson(json);
}
