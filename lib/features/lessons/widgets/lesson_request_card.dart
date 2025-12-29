import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

/// Card displaying a lesson request.
class LessonRequestCard extends StatelessWidget {
  const LessonRequestCard({
    required this.request,
    this.onApprove,
    this.onReject,
    this.onCounter,
    this.onTap,
    super.key,
  });

  final LessonRequestModel request;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  final VoidCallback? onCounter;
  final VoidCallback? onTap;

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
              // Header
              Row(
                children: [
                  _buildInitiatorBadge(context),
                  const Spacer(),
                  _buildStatusChip(context),
                ],
              ),

              const SizedBox(height: 12),

              // Proposed date and time
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 16, color: theme.hintColor),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat.yMMMd().format(request.effectiveDate),
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(width: 16),
                  Icon(Icons.access_time, size: 16, color: theme.hintColor),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat.jm().format(request.effectiveDate),
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Duration and type
              Row(
                children: [
                  Icon(Icons.timelapse, size: 16, color: theme.hintColor),
                  const SizedBox(width: 8),
                  Text(
                    request.durationFormatted,
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(width: 16),
                  Chip(
                    label: Text(
                      request.lessonType.displayName,
                      style: const TextStyle(fontSize: 11),
                    ),
                    padding: EdgeInsets.zero,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Participants
              Row(
                children: [
                  Icon(Icons.person, size: 16, color: theme.hintColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${request.trainerName ?? "Trainer"} ↔ ${request.clientName ?? "Client"}',
                      style: theme.textTheme.bodyMedium,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),

              // Horse if assigned
              if (request.horseName != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.pets, size: 16, color: theme.hintColor),
                    const SizedBox(width: 8),
                    Text(
                      request.horseName!,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ],

              // Counter proposal info
              if (request.status == LessonStatus.countered &&
                  request.counterNotes != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline,
                          size: 16, color: Colors.orange),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          request.counterNotes!,
                          style: theme.textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // Notes
              if (request.notes != null && request.notes!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  request.notes!,
                  style: theme.textTheme.bodySmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              // Actions for pending requests
              if (request.isPending &&
                  (onApprove != null || onReject != null || onCounter != null)) ...[
                const SizedBox(height: 12),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (onReject != null)
                      TextButton(
                        onPressed: onReject,
                        child: const Text('Decline'),
                      ),
                    if (onCounter != null)
                      TextButton(
                        onPressed: onCounter,
                        child: const Text('Counter'),
                      ),
                    if (onApprove != null)
                      FilledButton(
                        onPressed: onApprove,
                        child: const Text('Approve'),
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

  Widget _buildInitiatorBadge(BuildContext context) {
    final isClient = request.initiatedBy == RequestInitiator.client;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          isClient ? Icons.person_outline : Icons.school,
          size: 16,
          color: isClient ? Colors.blue : Colors.purple,
        ),
        const SizedBox(width: 4),
        Text(
          isClient ? 'Client Request' : 'Trainer Proposal',
          style: TextStyle(
            fontSize: 12,
            color: isClient ? Colors.blue : Colors.purple,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusChip(BuildContext context) {
    final (color, bgColor, text) = switch (request.status) {
      LessonStatus.requested => (Colors.orange, Colors.orange.shade50, 'Pending'),
      LessonStatus.approved => (Colors.green, Colors.green.shade50, 'Approved'),
      LessonStatus.rejected => (Colors.red, Colors.red.shade50, 'Declined'),
      LessonStatus.countered => (Colors.purple, Colors.purple.shade50, 'Counter'),
      LessonStatus.cancelled => (Colors.grey, Colors.grey.shade100, 'Cancelled'),
      _ => (Colors.grey, Colors.grey.shade100, request.status.displayName),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
