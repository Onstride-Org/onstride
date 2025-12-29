import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/common/dialogs/confirm_dialog.dart';
import 'package:gl_horses/core/providers/account/account_provider.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/gen_l10n/app_localizations.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

class TaskDetailsModal extends ConsumerStatefulWidget {
  const TaskDetailsModal({
    required this.task,
    super.key,
    this.onUpdateTask,
    this.onDeleteTask,
  });

  final TaskModel task;
  final Future<void> Function()? onUpdateTask;
  final Future<void> Function()? onDeleteTask;

  @override
  ConsumerState<TaskDetailsModal> createState() => _TaskDetailsModalState();
}

class _TaskDetailsModalState extends ConsumerState<TaskDetailsModal> {
  bool isLoading = false;

  @override
  Widget build(BuildContext context) {
    final accountState = ref.watch(accountProvider);
    final currentUser = accountState.currentUser;
    final createdStr = DateFormat('MMM d, yyyy').format(widget.task.createdAt);
    final dueStr = widget.task.dueDate.mmmDdYyyyTime(context.l10n.locale);

    final hasPermissionToCompleteTask = widget.task.assigneeIds.contains(
      dueStr,
    );
    // currentUser.accountType == AccountType.owner ||
    // currentUser.accountType == AccountType.manager ||
    // (currentUser.accountType == AccountType.groomer &&

    return Padding(
      padding: 27.edgeInsetsH,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GLSpaces.px8,
          Center(
            child: Container(
              width: 40,
              height: 5,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2.5),
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _TaskStatusBadge(task: widget.task),
              if (currentUser.accountType != AccountType.boarder) ...[
                IconButton(
                  onPressed: () async {
                    final confirmed = await ConfirmDialog.show(
                      context,
                      title: context.l10n.deleteTaskTitle,
                      description: context.l10n.deleteTaskDescription(
                        widget.task.name,
                      ),
                      confirmText: context.l10n.delete,
                    );
                    if (confirmed ?? false) {
                      if (context.mounted) {
                        Navigator.of(context).pop();
                      }
                      if (widget.onDeleteTask != null) {
                        await widget.onDeleteTask!();
                      }
                    }
                  },
                  icon: const Icon(GLIcons.delete),
                  color: GLColors.error400,
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.red.shade50,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ],
          ),
          GLSpaces.px12,
          _TaskDetailsSection(
            task: widget.task,
            createdStr: createdStr,
            dueStr: dueStr,
            ref: ref,
          ),
          GLSpaces.px32,
          _ModalActionButtons(
            isLoading: isLoading,
            status: widget.task.status,
            hasPermissionToCompleteTask: hasPermissionToCompleteTask,
            onPrimaryPressed: () async {
              if (widget.onUpdateTask != null) {
                setState(() => isLoading = true);
                await widget.onUpdateTask!();
                if (mounted) setState(() => isLoading = false);
              }
              if (context.mounted) Navigator.of(context).pop();
            },
            onSecondaryPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }
}

class _TaskStatusBadge extends StatelessWidget {
  const _TaskStatusBadge({
    required this.task,
  });

  final TaskModel task;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: task.status.statusColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        _getStatusLabel(
          localizations: context.l10n,
          status: task.status,
          dueDate: task.dueDate,
        ),
        style: TextStyle(
          color: task.status.statusFontColor,
          fontSize: 12,
        ),
      ),
    );
  }

  String _getStatusLabel({
    required AppLocalizations localizations,
    required TaskStatus status,
    required DateTime dueDate,
  }) {
    if (status == TaskStatus.completed) {
      return localizations.statusCompleted;
    }

    if (status == TaskStatus.overdue) {
      return localizations.statusOverdue;
    }

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

class _TaskDetailsSection extends StatelessWidget {
  const _TaskDetailsSection({
    required this.task,
    required this.createdStr,
    required this.dueStr,
    required this.ref,
  });

  final TaskModel task;
  final String createdStr;
  final String dueStr;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    var groomName = context.l10n.unknownGroomerLabel;

    final currentUser = ref.watch(accountProvider).currentUser;
    if (task.groomId == currentUser.id && currentUser.name != null) {
      groomName = currentUser.name!;
    } else {
      final groomers = ref.watch(fetchUsersProvider).allUsers;
      final groomUser = groomers
          .where((user) => user.id == task.groomId)
          .firstOrNull;
      if (groomUser != null) {
        groomName =
            groomUser.name ??
            groomUser.email ??
            context.l10n.unknownGroomerLabel;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          task.name,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: context.primaryColor,
            fontWeight: FontWeight.w400,
          ),
        ),
        GLSpaces.px12,
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 4,
              child: Text(
                '${context.l10n.horseLabel}: ${task.horseNames.join(', ')}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w400,
                ),
              ),
            ),
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  Assets.images.iconUser.image(height: 18),
                  GLSpaces.px8,
                  Text(
                    task.groomId != null
                        ? groomName
                        : task.assigneeNames.join(', '),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        GLSpaces.px12,
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${context.l10n.createdLabel}: $createdStr',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w400,
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${context.l10n.dueDate}:',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w400,
                  ),
                ),
                Text(
                  dueStr,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}

class _ModalActionButtons extends StatelessWidget {
  const _ModalActionButtons({
    required this.isLoading,
    required this.status,
    required this.hasPermissionToCompleteTask,
    required this.onPrimaryPressed,
    required this.onSecondaryPressed,
  });

  final bool isLoading;
  final TaskStatus status;
  final bool hasPermissionToCompleteTask;
  final VoidCallback onPrimaryPressed;
  final VoidCallback onSecondaryPressed;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: (isLoading || !hasPermissionToCompleteTask)
                ? null
                : onPrimaryPressed,
            style: status == TaskStatus.completed
                ? GLButtonStyles.secondaryM
                : GLButtonStyles.outlineM,
            child: isLoading
                ? Center(
                    child: SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: context.primaryColor,
                        strokeWidth: 2,
                      ),
                    ),
                  )
                : Text(
                    status == TaskStatus.completed
                        ? context.l10n.markAsUndone
                        : context.l10n.markAsDone,
                  ),
          ),
        ),
        GLSpaces.px16,
        Expanded(
          child: ElevatedButton(
            onPressed: onSecondaryPressed,
            style: GLButtonStyles.primaryM,
            child: Text(context.l10n.close),
          ),
        ),
      ],
    );
  }
}
