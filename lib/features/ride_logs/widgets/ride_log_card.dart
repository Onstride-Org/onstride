import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

class RideLogCard extends StatelessWidget {
  const RideLogCard({
    required this.rideLog,
    this.onTap,
    this.onEdit,
    this.onDelete,
    super.key,
  });

  final RideLogModel rideLog;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM dd, yyyy');
    final timeFormat = DateFormat('h:mm a');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _RideTypeChip(type: rideLog.type),
                  if (onEdit != null || onDelete != null)
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert, size: 20),
                      onSelected: (value) {
                        if (value == 'edit') onEdit?.call();
                        if (value == 'delete') onDelete?.call();
                      },
                      itemBuilder: (context) => [
                        if (onEdit != null)
                          const PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                Icon(Icons.edit, size: 18),
                                SizedBox(width: 8),
                                Text('Edit'),
                              ],
                            ),
                          ),
                        if (onDelete != null)
                          const PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete, size: 18, color: Colors.red),
                                SizedBox(width: 8),
                                Text('Delete', style: TextStyle(color: Colors.red)),
                              ],
                            ),
                          ),
                      ],
                    ),
                ],
              ),
              GLSpaces.px8,
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    dateFormat.format(rideLog.date),
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(width: 16),
                  Icon(
                    Icons.access_time,
                    size: 16,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    timeFormat.format(rideLog.date),
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
              GLSpaces.px8,
              Row(
                children: [
                  Icon(
                    Icons.timer,
                    size: 16,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    rideLog.durationFormatted,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (rideLog.riderName != null && rideLog.riderName!.isNotEmpty) ...[
                    const SizedBox(width: 16),
                    Icon(
                      Icons.person,
                      size: 16,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        rideLog.riderName!,
                        style: Theme.of(context).textTheme.bodyMedium,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ],
              ),
              if (rideLog.notes != null && rideLog.notes!.isNotEmpty) ...[
                GLSpaces.px8,
                Text(
                  rideLog.notes!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _RideTypeChip extends StatelessWidget {
  const _RideTypeChip({required this.type});

  final RideType type;

  Color get _backgroundColor {
    switch (type) {
      case RideType.lesson:
        return Colors.blue.shade100;
      case RideType.training:
        return Colors.green.shade100;
      case RideType.trail:
        return Colors.orange.shade100;
      case RideType.lunging:
        return Colors.purple.shade100;
      case RideType.groundwork:
        return Colors.teal.shade100;
      case RideType.competition:
        return Colors.red.shade100;
      case RideType.other:
        return Colors.grey.shade200;
    }
  }

  Color get _textColor {
    switch (type) {
      case RideType.lesson:
        return Colors.blue.shade700;
      case RideType.training:
        return Colors.green.shade700;
      case RideType.trail:
        return Colors.orange.shade700;
      case RideType.lunging:
        return Colors.purple.shade700;
      case RideType.groundwork:
        return Colors.teal.shade700;
      case RideType.competition:
        return Colors.red.shade700;
      case RideType.other:
        return Colors.grey.shade700;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: _backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        type.displayName,
        style: TextStyle(
          color: _textColor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
