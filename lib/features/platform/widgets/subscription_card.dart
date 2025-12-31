import 'package:flutter/material.dart';
import 'package:models/models.dart';

import '../services/subscription_service.dart';

/// Card displaying a subscription plan
class SubscriptionPlanCard extends StatelessWidget {
  const SubscriptionPlanCard({
    required this.plan,
    this.isCurrentPlan = false,
    this.onSelect,
    this.showYearlyPricing = false,
    super.key,
  });

  final SubscriptionPlan plan;
  final bool isCurrentPlan;
  final VoidCallback? onSelect;
  final bool showYearlyPricing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final service = SubscriptionService();
    final savings = service.calculateYearlySavings(plan);

    return Card(
      elevation: isCurrentPlan ? 4 : 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isCurrentPlan
            ? BorderSide(color: theme.colorScheme.primary, width: 2)
            : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        plan.name,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (plan.description != null)
                        Text(
                          plan.description!,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
                if (isCurrentPlan)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Current',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  showYearlyPricing
                      ? service.formatPrice(plan.yearlyPriceCents, yearly: true)
                      : service.formatPrice(plan.monthlyPriceCents),
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.primary,
                  ),
                ),
                if (showYearlyPricing && savings > 0) ...[
                  const SizedBox(width: 8),
                  Text(
                    'Save \$${(savings / 100).toStringAsFixed(0)}',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: Colors.green,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            _buildFeatureRow(
              context,
              'Horses',
              plan.maxHorses == -1 ? 'Unlimited' : '${plan.maxHorses}',
            ),
            _buildFeatureRow(
              context,
              'Users',
              plan.maxUsers == -1 ? 'Unlimited' : '${plan.maxUsers}',
            ),
            _buildFeatureRow(
              context,
              'Lessons/month',
              plan.maxLessonsPerMonth == -1
                  ? 'Unlimited'
                  : '${plan.maxLessonsPerMonth}',
            ),
            if (plan.hasBilling) _buildFeatureCheck(context, 'Billing'),
            if (plan.hasFullBilling)
              _buildFeatureCheck(context, 'Full Billing Suite'),
            if (plan.hasAiFeatures) _buildFeatureCheck(context, 'AI Features'),
            if (plan.hasMultiBarn)
              _buildFeatureCheck(context, 'Multi-Barn Management'),
            if (plan.hasBranding) _buildFeatureCheck(context, 'Custom Branding'),
            if (plan.hasApiAccess) _buildFeatureCheck(context, 'API Access'),
            if (plan.hasPrioritySupport)
              _buildFeatureCheck(context, 'Priority Support'),
            if (plan.hasDedicatedSupport)
              _buildFeatureCheck(context, 'Dedicated Support'),
            const SizedBox(height: 16),
            if (!isCurrentPlan && onSelect != null)
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: onSelect,
                  child: Text(
                    plan.tier == SubscriptionTier.free
                        ? 'Get Started'
                        : 'Upgrade',
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureRow(BuildContext context, String label, String value) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: theme.textTheme.bodyMedium),
          Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCheck(BuildContext context, String feature) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            Icons.check_circle,
            size: 18,
            color: theme.colorScheme.primary,
          ),
          const SizedBox(width: 8),
          Text(feature, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}

/// Card showing current subscription usage
class SubscriptionUsageCard extends StatelessWidget {
  const SubscriptionUsageCard({
    required this.subscription,
    required this.usage,
    super.key,
  });

  final BarnSubscription subscription;
  final UsageMetrics usage;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final service = SubscriptionService();
    final plan = service.getPlanByTier(subscription.tier);

    if (plan == null) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.analytics_outlined,
                    color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Usage',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildUsageBar(
              context,
              'Horses',
              usage.horseCount,
              plan.maxHorses,
            ),
            const SizedBox(height: 12),
            _buildUsageBar(
              context,
              'Users',
              usage.userCount,
              plan.maxUsers,
            ),
            const SizedBox(height: 12),
            _buildUsageBar(
              context,
              'Lessons this month',
              usage.lessonCount,
              plan.maxLessonsPerMonth,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUsageBar(
    BuildContext context,
    String label,
    int current,
    int max,
  ) {
    final theme = Theme.of(context);
    final isUnlimited = max == -1;
    final percentage = isUnlimited ? 0.0 : (current / max).clamp(0.0, 1.0);
    final isNearLimit = percentage >= 0.8;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: theme.textTheme.bodyMedium),
            Text(
              isUnlimited ? '$current' : '$current / $max',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: isNearLimit ? Colors.orange : null,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        if (!isUnlimited)
          LinearProgressIndicator(
            value: percentage,
            backgroundColor: theme.colorScheme.surfaceContainerHighest,
            color: isNearLimit ? Colors.orange : theme.colorScheme.primary,
          )
        else
          Text(
            'Unlimited',
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
      ],
    );
  }
}

/// Card showing upgrade recommendations
class UpgradeRecommendationCard extends StatelessWidget {
  const UpgradeRecommendationCard({
    required this.recommendation,
    this.onUpgrade,
    super.key,
  });

  final UpgradeRecommendation recommendation;
  final VoidCallback? onUpgrade;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      color: theme.colorScheme.tertiaryContainer.withOpacity(0.3),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              Icons.upgrade,
              color: theme.colorScheme.tertiary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recommendation.title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    recommendation.description,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            if (onUpgrade != null)
              TextButton(
                onPressed: onUpgrade,
                child: const Text('Upgrade'),
              ),
          ],
        ),
      ),
    );
  }
}
