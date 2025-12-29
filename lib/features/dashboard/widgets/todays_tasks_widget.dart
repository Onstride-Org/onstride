import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

/// Widget displaying today's tasks assigned to the current user.
class TodaysTasksWidget extends ConsumerWidget {
  const TodaysTasksWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(accountProvider).currentUser;
    final taskListState = ref.watch(getTaskListProvider);

    final isLoading = taskListState is InitialGetTaskListState ||
        taskListState is LoadingGetTaskListState;

    final today = DateTime.now();
    final tasks =
        ref.read(getTaskListProvider.notifier).getTasksFromState(today);

    // Filter to show tasks assigned to current user
    final myTasks = tasks.where((task) {
      final isAssignedToMe = task.assignees.any((a) => a.id == user.id);
      final isNotCompleted = task.status != TaskStatus.completed;
      return isAssignedToMe && isNotCompleted;
    }).toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));

    // Show max 5 tasks
    final displayTasks = myTasks.take(5).toList();

    return DashboardCard(
      title: context.l10n.todaysTasks,
      icon: GLIcons.taskoutline,
      trailing: myTasks.isNotEmpty
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: context.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${myTasks.length}',
                style: TextStyle(
                  color: context.primaryColor,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            )
          : null,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: isLoading
            ? const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
                ),
              )
            : displayTasks.isEmpty
                ? _EmptyTasksMessage()
                : Column(
                    children: [
                      ...displayTasks.map(
                        (task) => _TaskItem(task: task, user: user),
                      ),
                      if (myTasks.length > 5)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            context.l10n.andMoreTasks(myTasks.length - 5),
                            style: context.bodySmall.copyWith(
                              color: context.hintColor,
                            ),
                          ),
                        ),
                    ],
                  ),
      ),
    );
  }
}

class _EmptyTasksMessage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(
            Icons.check_circle_outline,
            color: Colors.green.shade400,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            context.l10n.noTasksForToday,
            style: context.bodyMedium.copyWith(color: context.hintColor),
          ),
        ],
      ),
    );
  }
}

class _TaskItem extends ConsumerWidget {
  const _TaskItem({required this.task, required this.user});

  final TaskModel task;
  final GLUser user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOverdue = task.dueDate.isBefore(DateTime.now()) &&
        task.status != TaskStatus.completed;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: InkWell(
        onTap: () => _showTaskDetails(context, ref),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isOverdue
                ? Colors.red.shade50
                : GLColors.neutral1100.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              _StatusCheckbox(task: task, user: user),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.name,
                      style: context.bodyMedium.copyWith(
                        fontWeight: FontWeight.w500,
                        decoration: task.status == TaskStatus.completed
                            ? TextDecoration.lineThrough
                            : null,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (task.horses.isNotEmpty)
                      Text(
                        task.horses.map((h) => h.name).join(', '),
                        style: context.bodySmall.copyWith(
                          color: context.hintColor,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                _formatTime(task.dueDate),
                style: context.bodySmall.copyWith(
                  color: isOverdue ? Colors.red : context.hintColor,
                  fontWeight: isOverdue ? FontWeight.w600 : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime date) {
    final hour = date.hour;
    final minute = date.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$displayHour:$minute $period';
  }

  Future<void> _showTaskDetails(BuildContext context, WidgetRef ref) async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.25),
      builder: (context) => Material(
        color: Colors.transparent,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: 16.borderRadiusT,
          ),
          child: SafeArea(
            top: false,
            child: TaskDetailsModal(
              task: task,
              onUpdateTask: () async {
                final updatedTask = task.copyWith(
                  status: task.status == TaskStatus.completed
                      ? TaskStatus.notStarted
                      : TaskStatus.completed,
                );
                await ref.read(updateTaskProvider.notifier).update(updatedTask);
                await ref
                    .read(getTaskListProvider.notifier)
                    .refreshCurrentMonth(
                      groomId: user.accountType == AccountType.groomer
                          ? user.id
                          : null,
                      boarderId: user.accountType == AccountType.boarder
                          ? user.id
                          : null,
                      barnId: user.barnId,
                    );
              },
              onDeleteTask: () async {
                await ref
                    .read(deleteTaskProvider.notifier)
                    .deleteTask(task.id);
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusCheckbox extends ConsumerWidget {
  const _StatusCheckbox({required this.task, required this.user});

  final TaskModel task;
  final GLUser user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCompleted = task.status == TaskStatus.completed;

    return GestureDetector(
      onTap: () async {
        final updatedTask = task.copyWith(
          status: isCompleted ? TaskStatus.notStarted : TaskStatus.completed,
        );
        await ref.read(updateTaskProvider.notifier).update(updatedTask);
        await ref.read(getTaskListProvider.notifier).refreshCurrentMonth(
              groomId:
                  user.accountType == AccountType.groomer ? user.id : null,
              boarderId:
                  user.accountType == AccountType.boarder ? user.id : null,
              barnId: user.barnId,
            );
      },
      child: Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: isCompleted ? Colors.green : Colors.transparent,
          border: Border.all(
            color: isCompleted ? Colors.green : GLColors.neutral1100,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(6),
        ),
        child: isCompleted
            ? const Icon(Icons.check, color: Colors.white, size: 16)
            : null,
      ),
    );
  }
}
