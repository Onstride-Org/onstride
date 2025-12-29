import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

/// List view for displaying billing periods.
class BillingPeriodsListView extends ConsumerWidget {
  const BillingPeriodsListView({
    required this.periods,
    super.key,
  });

  final List<BillingPeriodModel> periods;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currencyFormat = NumberFormat.currency(symbol: r'$');

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: periods.length,
      itemBuilder: (context, index) {
        final period = periods[index];

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        period.periodLabel,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    _StatusChip(status: period.status),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${DateFormat.yMMMd().format(period.startDate)} - '
                  '${DateFormat.yMMMd().format(period.endDate)}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _StatColumn(
                      label: 'Total Charges',
                      value: currencyFormat.format(period.totalCharges),
                    ),
                    const SizedBox(width: 24),
                    _StatColumn(
                      label: 'Amount Paid',
                      value: currencyFormat.format(period.amountPaid),
                    ),
                    const SizedBox(width: 24),
                    _StatColumn(
                      label: 'Balance Due',
                      value: currencyFormat.format(period.balanceRemaining),
                      valueColor: period.balanceRemaining > 0
                          ? Colors.red
                          : Colors.green,
                    ),
                  ],
                ),
                if (period.status == BillingPeriodStatus.open) ...[
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      OutlinedButton(
                        onPressed: () {
                          // View/Edit period
                        },
                        child: const Text('Edit'),
                      ),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: () {
                          // Finalize period
                        },
                        child: const Text('Close Period'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final BillingPeriodStatus status;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (status) {
      BillingPeriodStatus.open => (Colors.blue, 'Open'),
      BillingPeriodStatus.invoiced => (Colors.orange, 'Invoiced'),
      BillingPeriodStatus.closed => (Colors.green, 'Closed'),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  const _StatColumn({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: valueColor,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
