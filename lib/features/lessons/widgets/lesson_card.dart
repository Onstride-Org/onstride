import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

/// Card displaying a scheduled lesson.
class LessonCard extends StatelessWidget {
  const LessonCard({
    required this.lesson,
    this.onTap,
    this.onComplete,
    this.onCancel,
    super.key,
  });

  final LessonModel lesson;
  final VoidCallback? onTap;
  final VoidCallback? onComplete;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with type and status
              Row(
                children: [
                  _buildTypeChip(context),
                  const Spacer(),
                  _buildStatusChip(context),
                ],
              ),

              const SizedBox(height: 12),

              // Date and time
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 16, color: theme.hintColor),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat.yMMMd().format(lesson.scheduledDate),
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(width: 16),
                  Icon(Icons.access_time, size: 16, color: theme.hintColor),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat.jm().format(lesson.scheduledDate),
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '(${lesson.durationFormatted})',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Trainer and client
              Row(
                children: [
                  Icon(Icons.person, size: 16, color: theme.hintColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${lesson.trainerName ?? "Trainer"} → ${lesson.clientName ?? "Client"}',
                      style: theme.textTheme.bodyMedium,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),

              // Horse if assigned
              if (lesson.horseName != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.pets, size: 16, color: theme.hintColor),
                    const SizedBox(width: 8),
                    Text(
                      lesson.horseName!,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ],

              // Notes if present
              if (lesson.notes != null && lesson.notes!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  lesson.notes!,
                  style: theme.textTheme.bodySmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              // Actions
              if (lesson.canComplete || lesson.canCancel) ...[
                const SizedBox(height: 12),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (lesson.canCancel && onCancel != null)
                      TextButton(
                        onPressed: onCancel,
                        child: const Text('Cancel'),
                      ),
                    if (lesson.canComplete && onComplete != null)
                      FilledButton(
                        onPressed: onComplete,
                        child: const Text('Complete'),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeChip(BuildContext context) {
    return Chip(
      label: Text(
        lesson.type.displayName,
        style: const TextStyle(fontSize: 12),
      ),
      padding: EdgeInsets.zero,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  Widget _buildStatusChip(BuildContext context) {
    final (color, bgColor) = switch (lesson.status) {
      LessonStatus.approved => (Colors.green, Colors.green.shade50),
      LessonStatus.completed => (Colors.blue, Colors.blue.shade50),
      LessonStatus.cancelled => (Colors.red, Colors.red.shade50),
      _ => (Colors.grey, Colors.grey.shade100),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        lesson.status.displayName,
        style: TextStyle(
          fontSize: 12,
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
