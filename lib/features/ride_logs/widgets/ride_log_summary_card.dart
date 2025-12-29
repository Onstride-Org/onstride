import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:models/models.dart';

class RideLogSummaryCard extends StatelessWidget {
  const RideLogSummaryCard({
    required this.summary,
    super.key,
  });

  final RideLogSummary summary;

  String _formatDuration(int minutes) {
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (hours > 0) {
      return '${hours}h ${mins}m';
    }
    return '${mins}m';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Ride Statistics',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            GLSpaces.px16,
            Row(
              children: [
                Expanded(
                  child: _StatItem(
                    icon: Icons.directions_run,
                    label: 'This Month',
                    value: '${summary.ridesThisMonth} rides',
                    subValue: _formatDuration(summary.minutesThisMonth),
                  ),
                ),
                Container(
                  width: 1,
                  height: 60,
                  color: Colors.grey.shade300,
                ),
                Expanded(
                  child: _StatItem(
                    icon: Icons.bar_chart,
                    label: 'All Time',
                    value: '${summary.totalRides} rides',
                    subValue: _formatDuration(summary.totalMinutes),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.subValue,
  });

  final IconData icon;
  final String label;
  final String value;
  final String subValue;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: Theme.of(context).colorScheme.primary, size: 24),
        const SizedBox(height: 8),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          subValue,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
      ],
    );
  }
}
