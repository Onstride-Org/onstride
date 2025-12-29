import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';

/// Card displaying a smart scheduling suggestion.
class SchedulingSuggestionCard extends StatelessWidget {
  const SchedulingSuggestionCard({
    required this.suggestion,
    this.onAccept,
    this.onReject,
    this.onDismiss,
    super.key,
  });

  final SchedulingSuggestion suggestion;
  final VoidCallback? onAccept;
  final VoidCallback? onReject;
  final VoidCallback? onDismiss;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = _getTypeIconAndColor(suggestion.type);
    final priorityColor = _getPriorityColor(suggestion.priority);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                GLSpaces.px12,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        suggestion.title,
                        style: context.titleSmall.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      GLSpaces.px4,
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: priorityColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              suggestion.priority.name.toUpperCase(),
                              style: context.bodySmall.copyWith(
                                color: priorityColor,
                                fontWeight: FontWeight.w600,
                                fontSize: 10,
                              ),
                            ),
                          ),
                          GLSpaces.px8,
                          Text(
                            '${(suggestion.confidence * 100).toInt()}% confidence',
                            style: context.bodySmall.copyWith(
                              color: GLColors.neutral500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (onDismiss != null)
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: onDismiss,
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),
            GLSpaces.px12,
            Text(
              suggestion.description,
              style: context.bodyMedium,
            ),
            if (suggestion.reason != null) ...[
              GLSpaces.px8,
              Text(
                suggestion.reason!,
                style: context.bodySmall.copyWith(
                  color: GLColors.neutral600,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
            if (suggestion.suggestedStartTime != null) ...[
              GLSpaces.px12,
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: GLColors.neutral100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.schedule, size: 20, color: GLColors.brand600),
                    GLSpaces.px8,
                    Text(
                      'Suggested: ${_formatDateTime(suggestion.suggestedStartTime!)}',
                      style: context.bodyMedium.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (!suggestion.isResolved) ...[
              GLSpaces.px16,
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (onReject != null)
                    TextButton(
                      onPressed: onReject,
                      child: const Text('Dismiss'),
                    ),
                  GLSpaces.px8,
                  if (onAccept != null)
                    FilledButton.icon(
                      onPressed: onAccept,
                      icon: const Icon(Icons.check, size: 18),
                      label: const Text('Apply'),
                    ),
                ],
              ),
            ] else ...[
              GLSpaces.px12,
              Row(
                children: [
                  Icon(
                    suggestion.resolution == 'accepted'
                        ? Icons.check_circle
                        : Icons.cancel,
                    size: 16,
                    color: suggestion.resolution == 'accepted'
                        ? Colors.green
                        : GLColors.neutral500,
                  ),
                  GLSpaces.px4,
                  Text(
                    suggestion.resolution == 'accepted' ? 'Applied' : 'Dismissed',
                    style: context.bodySmall.copyWith(
                      color: GLColors.neutral500,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  (IconData, Color) _getTypeIconAndColor(SuggestionType type) {
    switch (type) {
      case SuggestionType.lessonTime:
        return (Icons.school, Colors.blue);
      case SuggestionType.horseRest:
        return (Icons.bedtime, Colors.orange);
      case SuggestionType.trainerBalance:
        return (Icons.balance, Colors.purple);
      case SuggestionType.arenaOptimization:
        return (Icons.stadium, Colors.teal);
      case SuggestionType.conflictResolution:
        return (Icons.warning, Colors.red);
    }
  }

  Color _getPriorityColor(SuggestionPriority priority) {
    switch (priority) {
      case SuggestionPriority.low:
        return Colors.grey;
      case SuggestionPriority.medium:
        return Colors.blue;
      case SuggestionPriority.high:
        return Colors.orange;
      case SuggestionPriority.critical:
        return Colors.red;
    }
  }

  String _formatDateTime(DateTime dt) {
    final hour = dt.hour > 12 ? dt.hour - 12 : dt.hour;
    final amPm = dt.hour >= 12 ? 'PM' : 'AM';
    return '${dt.month}/${dt.day} at $hour:${dt.minute.toString().padLeft(2, '0')} $amPm';
  }
}

/// Card showing horse workload analysis.
class HorseWorkloadCard extends StatelessWidget {
  const HorseWorkloadCard({required this.analysis, super.key});

  final HorseWorkloadAnalysis analysis;

  @override
  Widget build(BuildContext context) {
    final (statusColor, statusIcon) = _getStatusColorAndIcon(analysis.status);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(statusIcon, color: statusColor, size: 24),
                GLSpaces.px8,
                Expanded(
                  child: Text(
                    analysis.horseName,
                    style: context.titleSmall.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    analysis.status.name.toUpperCase(),
                    style: context.bodySmall.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            GLSpaces.px16,
            Row(
              children: [
                Expanded(
                  child: _StatItem(
                    icon: Icons.directions_run,
                    label: 'Rides (7 days)',
                    value: '${analysis.ridesLast7Days}',
                  ),
                ),
                Expanded(
                  child: _StatItem(
                    icon: Icons.timer,
                    label: 'Avg Daily',
                    value: '${analysis.avgDailyMinutes.toStringAsFixed(0)} min',
                  ),
                ),
                Expanded(
                  child: _StatItem(
                    icon: Icons.hotel,
                    label: 'Days Since Rest',
                    value: '${analysis.daysSinceRest}',
                    isWarning: analysis.needsRest,
                  ),
                ),
              ],
            ),
            if (analysis.needsRest) ...[
              GLSpaces.px12,
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, size: 18, color: Colors.orange),
                    GLSpaces.px8,
                    Expanded(
                      child: Text(
                        'Consider scheduling a rest day',
                        style: context.bodySmall.copyWith(color: Colors.orange[800]),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  (Color, IconData) _getStatusColorAndIcon(WorkloadStatus status) {
    switch (status) {
      case WorkloadStatus.underworked:
        return (Colors.blue, Icons.trending_down);
      case WorkloadStatus.normal:
        return (Colors.green, Icons.check_circle);
      case WorkloadStatus.heavy:
        return (Colors.orange, Icons.trending_up);
      case WorkloadStatus.overworked:
        return (Colors.red, Icons.warning);
    }
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    this.isWarning = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool isWarning;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(
          icon,
          size: 20,
          color: isWarning ? Colors.orange : GLColors.neutral600,
        ),
        GLSpaces.px4,
        Text(
          value,
          style: context.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
            color: isWarning ? Colors.orange : null,
          ),
        ),
        Text(
          label,
          style: context.bodySmall.copyWith(color: GLColors.neutral500),
        ),
      ],
    );
  }
}
