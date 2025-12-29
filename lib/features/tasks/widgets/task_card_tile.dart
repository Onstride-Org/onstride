import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/providers/account/account_provider.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/gen_l10n/app_localizations.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class TaskCardTile extends ConsumerWidget {
  const TaskCardTile({
    required this.task,
    required this.onTap,
    super.key,
  });

  final TaskModel task;
  final void Function()? onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final users = ref.watch(fetchUsersProvider).allUsers;
    final currentUser = ref.watch(accountProvider).currentUser;
    final taskUsers =
        [
          if (task.assigneeIds.contains(currentUser.id)) currentUser,
          ...users,
        ].where(
          (user) => task.assigneeIds.contains(user.id),
        );

    final isBeingDeleted = ref
        .read(deleteTaskProvider.notifier)
        .isTaskBeingDeleted(task.id);

    final usersNames = task.assigneeNames.join(', ');
    return Container(
      margin: 8.edgeInsetsV,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade400, width: 0.5),
      ),
      child: Stack(
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: isBeingDeleted ? null : onTap,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                task.name,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            GLSpaces.px2,
                            const SizedBox(width: 2),
                            Flexible(
                              child: Text(
                                '@${task.horses.map((e) => e.name).join(', ')}',
                                style: const TextStyle(color: Colors.grey),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: task.status.statusColor,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          getStatusLabel(
                            localizations: context.l10n,
                            status: task.status.name,
                            dueDate: task.dueDate,
                          ),
                          style: TextStyle(
                            color: task.status.statusFontColor,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                  GLSpaces.px8,
                  // Footer row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        task.dueDate.mmmDdYyyyTime(context.l10n.locale),
                        style: const TextStyle(color: Colors.grey),
                      ),
                      Row(
                        children: [
                          Assets.images.iconUser.image(height: 18),
                          GLSpaces.px4,
                          Text(
                            usersNames.isNotEmpty
                                ? usersNames
                                : taskUsers.map((e) => e.name).join(', '),
                            style: const TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (isBeingDeleted)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
              ),
            )
          else
            const SizedBox.shrink(),
        ],
      ),
    );
  }

  String getStatusLabel({
    required AppLocalizations localizations,
    required String status,
    required DateTime dueDate,
  }) {
    if (status == 'completed') {
      return localizations.statusCompleted;
    }

    if (status == 'overdue') {
      return localizations.statusOverdue;
    }

    // Calculate days remaining
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dueDateOnly = DateTime(dueDate.year, dueDate.month, dueDate.day);

    final difference = dueDateOnly.difference(today).inDays;

    if (difference < 0) {
      return localizations.statusOverdue;
    } else if (difference == 0) {
      return localizations.today;
    } else if (difference == 1) {
      return localizations.oneDayLeft;
    } else {
      return localizations.daysLeft(difference);
    }
  }
}
