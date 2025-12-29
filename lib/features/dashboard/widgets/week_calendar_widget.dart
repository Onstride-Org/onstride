import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

/// Widget displaying an upcoming week calendar view.
class WeekCalendarWidget extends ConsumerStatefulWidget {
  const WeekCalendarWidget({super.key});

  @override
  ConsumerState<WeekCalendarWidget> createState() => _WeekCalendarWidgetState();
}

class _WeekCalendarWidgetState extends ConsumerState<WeekCalendarWidget> {
  DateTime _selectedDate = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(accountProvider).currentUser;
    final today = DateTime.now();
    final weekDays = _getWeekDays(today);
    final tasks =
        ref.read(getTaskListProvider.notifier).getTasksFromState(today);

    return DashboardCard(
      title: context.l10n.thisWeek,
      icon: GLIcons.calendar,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: weekDays.map((day) {
                final isSelected = _isSameDay(day, _selectedDate);
                final isToday = _isSameDay(day, today);
                final taskCount = _getTaskCountForDay(tasks, day, user);

                return _DayTile(
                  day: day,
                  isSelected: isSelected,
                  isToday: isToday,
                  taskCount: taskCount,
                  onTap: () {
                    setState(() {
                      _selectedDate = day;
                    });
                    // Fetch tasks for selected day
                    ref.read(getTaskListProvider.notifier).getTasksForDate(
                          date: day,
                          groomId: user.accountType == AccountType.groomer
                              ? user.id
                              : null,
                          boarderId: user.accountType == AccountType.boarder
                              ? user.id
                              : null,
                          barnId: user.barnId,
                        );
                  },
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: _SelectedDayTasks(
              selectedDate: _selectedDate,
              user: user,
            ),
          ),
        ],
      ),
    );
  }

  List<DateTime> _getWeekDays(DateTime today) {
    // Start from today and show 7 days
    return List.generate(7, (index) => today.add(Duration(days: index)));
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  int _getTaskCountForDay(List<TaskModel> tasks, DateTime day, GLUser user) {
    return tasks.where((task) {
      final isSameDay = _isSameDay(task.dueDate, day);
      final isAssignedToMe = task.assignees.any((a) => a.id == user.id);
      final isNotCompleted = task.status != TaskStatus.completed;
      return isSameDay && isAssignedToMe && isNotCompleted;
    }).length;
  }
}

class _DayTile extends StatelessWidget {
  const _DayTile({
    required this.day,
    required this.isSelected,
    required this.isToday,
    required this.taskCount,
    required this.onTap,
  });

  final DateTime day;
  final bool isSelected;
  final bool isToday;
  final int taskCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dayName = DateFormat('E').format(day).substring(0, 2);
    final dayNumber = day.day.toString();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? context.primaryColor
              : isToday
                  ? context.primaryColor.withValues(alpha: 0.1)
                  : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: isToday && !isSelected
              ? Border.all(color: context.primaryColor)
              : null,
        ),
        child: Column(
          children: [
            Text(
              dayName,
              style: TextStyle(
                color: isSelected
                    ? Colors.white
                    : isToday
                        ? context.primaryColor
                        : context.hintColor,
                fontSize: 11,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              dayNumber,
              style: TextStyle(
                color: isSelected
                    ? Colors.white
                    : isToday
                        ? context.primaryColor
                        : null,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            if (taskCount > 0)
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white : context.primaryColor,
                  shape: BoxShape.circle,
                ),
              )
            else
              const SizedBox(height: 6),
          ],
        ),
      ),
    );
  }
}

class _SelectedDayTasks extends ConsumerWidget {
  const _SelectedDayTasks({
    required this.selectedDate,
    required this.user,
  });

  final DateTime selectedDate;
  final GLUser user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks =
        ref.read(getTaskListProvider.notifier).getTasksFromState(selectedDate);
    final today = DateTime.now();
    final isToday = selectedDate.year == today.year &&
        selectedDate.month == today.month &&
        selectedDate.day == today.day;

    // Filter tasks for selected day and user
    final dayTasks = tasks.where((task) {
      final isSameDay = task.dueDate.year == selectedDate.year &&
          task.dueDate.month == selectedDate.month &&
          task.dueDate.day == selectedDate.day;
      final isAssignedToMe = task.assignees.any((a) => a.id == user.id);
      return isSameDay && isAssignedToMe;
    }).toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));

    final displayTasks = dayTasks.take(3).toList();

    if (displayTasks.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: GLColors.neutral1100.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event_available,
              color: context.hintColor,
              size: 18,
            ),
            const SizedBox(width: 8),
            Text(
              isToday
                  ? context.l10n.noTasksForToday
                  : context.l10n.noTasksOnThisDay,
              style: context.bodySmall.copyWith(color: context.hintColor),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        ...displayTasks.map((task) => _MiniTaskItem(task: task)),
        if (dayTasks.length > 3)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              context.l10n.andMoreTasks(dayTasks.length - 3),
              style: context.bodySmall.copyWith(
                color: context.hintColor,
              ),
            ),
          ),
      ],
    );
  }
}

class _MiniTaskItem extends StatelessWidget {
  const _MiniTaskItem({required this.task});

  final TaskModel task;

  @override
  Widget build(BuildContext context) {
    final isCompleted = task.status == TaskStatus.completed;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: GLColors.neutral1100.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: isCompleted
                    ? Colors.green
                    : _getPriorityColor(task.status),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                task.name,
                style: context.bodySmall.copyWith(
                  decoration: isCompleted ? TextDecoration.lineThrough : null,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Text(
              _formatTime(task.dueDate),
              style: context.bodySmall.copyWith(
                color: context.hintColor,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getPriorityColor(TaskStatus status) {
    switch (status) {
      case TaskStatus.overdue:
        return Colors.red;
      case TaskStatus.completed:
        return Colors.green;
      case TaskStatus.notStarted:
        return Colors.orange;
    }
  }

  String _formatTime(DateTime date) {
    final hour = date.hour;
    final minute = date.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$displayHour:$minute $period';
  }
}
