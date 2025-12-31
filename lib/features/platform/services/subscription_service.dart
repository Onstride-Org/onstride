import 'package:models/models.dart';

/// Service for managing subscriptions and feature gating.
class SubscriptionService {
  SubscriptionService();

  /// Gets all available subscription plans
  List<SubscriptionPlan> getAvailablePlans() {
    return SubscriptionPlan.defaultPlans;
  }

  /// Gets a specific plan by tier
  SubscriptionPlan? getPlanByTier(SubscriptionTier tier) {
    return SubscriptionPlan.defaultPlans.cast<SubscriptionPlan?>().firstWhere(
          (p) => p?.tier == tier,
          orElse: () => null,
        );
  }

  /// Checks if a feature is available for a subscription
  bool isFeatureAvailable(BarnSubscription subscription, String feature) {
    final plan = getPlanByTier(subscription.tier);
    if (plan == null) return false;

    switch (feature) {
      case 'billing':
        return plan.hasBilling;
      case 'fullBilling':
        return plan.hasFullBilling;
      case 'aiFeatures':
        return plan.hasAiFeatures;
      case 'multiBarn':
        return plan.hasMultiBarn;
      case 'branding':
        return plan.hasBranding;
      case 'apiAccess':
        return plan.hasApiAccess;
      case 'prioritySupport':
        return plan.hasPrioritySupport;
      case 'dedicatedSupport':
        return plan.hasDedicatedSupport;
      default:
        return true;
    }
  }

  /// Checks if a usage limit is exceeded
  UsageLimitStatus checkUsageLimit(
    BarnSubscription subscription,
    String limitType,
    int currentCount,
  ) {
    final plan = getPlanByTier(subscription.tier);
    if (plan == null) {
      return UsageLimitStatus(
        limitType: limitType,
        currentCount: currentCount,
        maxCount: 0,
        isExceeded: true,
        percentUsed: 100,
      );
    }

    int maxCount;
    switch (limitType) {
      case 'horses':
        maxCount = plan.maxHorses;
      case 'users':
        maxCount = plan.maxUsers;
      case 'lessonsPerMonth':
        maxCount = plan.maxLessonsPerMonth;
      case 'barns':
        maxCount = plan.maxBarns;
      default:
        maxCount = -1; // Unlimited
    }

    // -1 means unlimited
    if (maxCount == -1) {
      return UsageLimitStatus(
        limitType: limitType,
        currentCount: currentCount,
        maxCount: -1,
        isExceeded: false,
        percentUsed: 0,
        isUnlimited: true,
      );
    }

    return UsageLimitStatus(
      limitType: limitType,
      currentCount: currentCount,
      maxCount: maxCount,
      isExceeded: currentCount >= maxCount,
      percentUsed: (currentCount / maxCount * 100).clamp(0, 100).toInt(),
    );
  }

  /// Gets upgrade recommendations based on current usage
  List<UpgradeRecommendation> getUpgradeRecommendations(
    BarnSubscription subscription,
    UsageMetrics usage,
  ) {
    final recommendations = <UpgradeRecommendation>[];
    final plan = getPlanByTier(subscription.tier);
    if (plan == null) return recommendations;

    // Check if approaching horse limit
    if (plan.maxHorses != -1 && usage.horseCount >= plan.maxHorses * 0.8) {
      recommendations.add(UpgradeRecommendation(
        reason: 'horse_limit',
        title: 'Running out of horse slots',
        description:
            'You\'re using ${usage.horseCount} of ${plan.maxHorses} horses.',
        suggestedTier: _getNextTier(subscription.tier),
      ));
    }

    // Check if approaching user limit
    if (plan.maxUsers != -1 && usage.userCount >= plan.maxUsers * 0.8) {
      recommendations.add(UpgradeRecommendation(
        reason: 'user_limit',
        title: 'Running out of user slots',
        description: 'You\'re using ${usage.userCount} of ${plan.maxUsers} users.',
        suggestedTier: _getNextTier(subscription.tier),
      ));
    }

    // Suggest AI features if heavily using lessons
    if (!plan.hasAiFeatures && usage.lessonCount > 50) {
      recommendations.add(UpgradeRecommendation(
        reason: 'ai_features',
        title: 'Unlock AI Features',
        description:
            'With ${usage.lessonCount} lessons, AI scheduling could save you time.',
        suggestedTier: SubscriptionTier.pro,
      ));
    }

    return recommendations;
  }

  SubscriptionTier _getNextTier(SubscriptionTier current) {
    switch (current) {
      case SubscriptionTier.free:
        return SubscriptionTier.basic;
      case SubscriptionTier.basic:
        return SubscriptionTier.pro;
      case SubscriptionTier.pro:
        return SubscriptionTier.enterprise;
      case SubscriptionTier.enterprise:
        return SubscriptionTier.enterprise;
    }
  }

  /// Formats price for display
  String formatPrice(int cents, {bool yearly = false}) {
    final dollars = cents / 100;
    if (yearly) {
      return '\$${dollars.toStringAsFixed(0)}/year';
    }
    return '\$${dollars.toStringAsFixed(0)}/month';
  }

  /// Calculates yearly savings
  int calculateYearlySavings(SubscriptionPlan plan) {
    final monthlyTotal = plan.monthlyPriceCents * 12;
    return monthlyTotal - plan.yearlyPriceCents;
  }
}

/// Status of a usage limit
class UsageLimitStatus {
  final String limitType;
  final int currentCount;
  final int maxCount;
  final bool isExceeded;
  final int percentUsed;
  final bool isUnlimited;

  UsageLimitStatus({
    required this.limitType,
    required this.currentCount,
    required this.maxCount,
    required this.isExceeded,
    required this.percentUsed,
    this.isUnlimited = false,
  });
}

/// Upgrade recommendation
class UpgradeRecommendation {
  final String reason;
  final String title;
  final String description;
  final SubscriptionTier suggestedTier;

  UpgradeRecommendation({
    required this.reason,
    required this.title,
    required this.description,
    required this.suggestedTier,
  });
}
