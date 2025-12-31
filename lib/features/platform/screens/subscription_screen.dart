import 'package:flutter/material.dart';
import 'package:models/models.dart';

import '../services/services.dart';
import '../widgets/widgets.dart';

/// Subscription management screen
class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({
    required this.currentSubscription,
    required this.usage,
    super.key,
  });

  final BarnSubscription currentSubscription;
  final UsageMetrics usage;

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _showYearlyPricing = false;
  final _subscriptionService = SubscriptionService();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final layout = ResponsiveService.getLayoutInfo(context);
    final plans = _subscriptionService.getAvailablePlans();
    final recommendations = _subscriptionService.getUpgradeRecommendations(
      widget.currentSubscription,
      widget.usage,
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscription'),
      ),
      body: SingleChildScrollView(
        padding: layout.contentPadding,
        child: ResponsiveContent(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Current subscription info
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.workspace_premium,
                            color: theme.colorScheme.primary,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Current Plan',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Text(
                            widget.currentSubscription.tier.name.toUpperCase(),
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: widget.currentSubscription.isActive
                                  ? Colors.green.withOpacity(0.2)
                                  : Colors.red.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              widget.currentSubscription.isActive
                                  ? 'Active'
                                  : 'Inactive',
                              style: TextStyle(
                                color: widget.currentSubscription.isActive
                                    ? Colors.green
                                    : Colors.red,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (widget.currentSubscription.currentPeriodEnd != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Renews on ${_formatDate(widget.currentSubscription.currentPeriodEnd!)}',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Usage card
              SubscriptionUsageCard(
                subscription: widget.currentSubscription,
                usage: widget.usage,
              ),

              // Upgrade recommendations
              if (recommendations.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  'Recommendations',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                ...recommendations.map((rec) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: UpgradeRecommendationCard(
                        recommendation: rec,
                        onUpgrade: () => _showUpgradeDialog(rec.suggestedTier),
                      ),
                    )),
              ],

              const SizedBox(height: 24),

              // Plans header with toggle
              Row(
                children: [
                  Text(
                    'Available Plans',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  Text('Monthly'),
                  Switch(
                    value: _showYearlyPricing,
                    onChanged: (value) {
                      setState(() => _showYearlyPricing = value);
                    },
                  ),
                  Text('Yearly'),
                ],
              ),

              const SizedBox(height: 16),

              // Plan cards
              if (layout.isDesktop)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: plans.map((plan) {
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: SubscriptionPlanCard(
                          plan: plan,
                          isCurrentPlan:
                              plan.tier == widget.currentSubscription.tier,
                          showYearlyPricing: _showYearlyPricing,
                          onSelect: plan.tier != widget.currentSubscription.tier
                              ? () => _showUpgradeDialog(plan.tier)
                              : null,
                        ),
                      ),
                    );
                  }).toList(),
                )
              else
                ...plans.map((plan) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: SubscriptionPlanCard(
                      plan: plan,
                      isCurrentPlan:
                          plan.tier == widget.currentSubscription.tier,
                      showYearlyPricing: _showYearlyPricing,
                      onSelect: plan.tier != widget.currentSubscription.tier
                          ? () => _showUpgradeDialog(plan.tier)
                          : null,
                    ),
                  );
                }),

              const SizedBox(height: 24),

              // Billing history link
              Card(
                child: ListTile(
                  leading: const Icon(Icons.receipt_long),
                  title: const Text('Billing History'),
                  subtitle: const Text('View past invoices and payments'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // Navigate to billing history
                  },
                ),
              ),

              const SizedBox(height: 8),

              // Cancel subscription link
              if (widget.currentSubscription.tier != SubscriptionTier.free)
                Card(
                  child: ListTile(
                    leading: Icon(
                      Icons.cancel_outlined,
                      color: theme.colorScheme.error,
                    ),
                    title: Text(
                      'Cancel Subscription',
                      style: TextStyle(color: theme.colorScheme.error),
                    ),
                    subtitle: const Text('Downgrade to free plan'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _showCancelDialog(),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showUpgradeDialog(SubscriptionTier tier) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Upgrade to ${tier.name.toUpperCase()}'),
        content: Text(
          'Are you sure you want to upgrade your subscription? '
          'You will be charged the difference for the remainder of your billing cycle.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              // Handle upgrade
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Upgrade initiated')),
              );
            },
            child: const Text('Upgrade'),
          ),
        ],
      ),
    );
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Subscription'),
        content: const Text(
          'Are you sure you want to cancel your subscription? '
          'You will lose access to premium features at the end of your billing cycle.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Keep Subscription'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              // Handle cancellation
            },
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Cancel Subscription'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}
