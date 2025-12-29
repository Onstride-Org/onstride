import 'dart:ui';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/core/providers/notification_navigation/notification_navigation_provider.dart';
import 'package:gl_horses/core/providers/notification_navigation/notification_navigation_state.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/tasks/providers/get_boarder_horses/get_boarder_horses_provider.dart';
import 'package:gl_horses/l10n/gen_l10n/app_localizations.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class TaskScreen extends ConsumerStatefulWidget {
  const TaskScreen({this.showGreeting = false, super.key});

  final bool showGreeting;

  static const path = '/tasks';
  static const name = 'tasks';

  @override
  ConsumerState<TaskScreen> createState() => _TaskScreenState();
}

class _TaskScreenState extends ConsumerState<TaskScreen> {
  DateTime focusedDate = DateTime.now();
  DateTime selectedDate = DateTime.now();
  final searchController = TextEditingController();
  late AppLocalizations l10n;
  final List<String> _monthNames = [];
  late GLUser user;
  bool _isProcessingNotification = false;

  @override
  void initState() {
    super.initState();
    user = ref.read(accountProvider).currentUser;
    selectedDate = focusedDate;

    // Check if there's already a notification navigation state
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final navigationState = ref.read(notificationNavigationProvider);

      if (navigationState is NavigateToTaskState) {
        await _handleNotificationNavigation(null, navigationState);
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!_isProcessingNotification) {
        await ref.read(fetchUsersProvider.notifier).fetchUsers();
        await ref
            .read(getTaskListProvider.notifier)
            .getTasksForDate(
              date: selectedDate,
              groomId: user.accountType == AccountType.groomer ? user.id : null,
              boarderId: user.accountType == AccountType.boarder
                  ? user.id
                  : null,
              barnId: user.barnId,
            );
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    l10n = context.l10n;
    if (_monthNames.isEmpty) {
      _monthNames.addAll([
        l10n.january,
        l10n.february,
        l10n.march,
        l10n.april,
        l10n.may,
        l10n.june,
        l10n.july,
        l10n.august,
        l10n.september,
        l10n.october,
        l10n.november,
        l10n.december,
      ]);
    }
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  void _onPrevMonth() {
    setState(() {
      focusedDate = DateTime(focusedDate.year, focusedDate.month - 1);
    });
  }

  void _onNextMonth() {
    setState(() {
      focusedDate = DateTime(focusedDate.year, focusedDate.month + 1);
    });
  }

  void _onDaySelected(DateTime selected, DateTime focused) {
    setState(() {
      selectedDate = selected;
      focusedDate = focused;
    });
    ref
        .read(getTaskListProvider.notifier)
        .getTasksForDate(
          date: selectedDate,
          groomId: user.accountType == AccountType.groomer ? user.id : null,
          boarderId: user.accountType == AccountType.boarder ? user.id : null,
          barnId: user.barnId,
        );
  }

  void _onSelectMonth(String month) {
    final idx = _monthNames.indexOf(month) + 1;
    setState(() {
      focusedDate = DateTime(focusedDate.year, idx);
    });
  }

  void _handleNotificationTaskNavigation(String taskId) {
    if (!mounted || taskId.isEmpty) return;

    final allTasks = ref
        .read(getTaskListProvider.notifier)
        .getTasksFromState(selectedDate)
        .map(
          (task) => task.dueDate.hour == 0 && task.dueDate.minute == 0
              ? task.copyWith(
                  dueDate: DateTime(
                    task.dueDate.year,
                    task.dueDate.month,
                    task.dueDate.day,
                    23,
                    59,
                  ),
                )
              : task,
        )
        .toList();

    try {
      final task = allTasks.firstWhere((task) => task.id == taskId);

      if (mounted) {
        _showNotificationTaskDetailsModal(task);
      }
    } catch (e) {
      if (mounted) {
        ref
            .read(notificationNavigationProvider.notifier)
            .handleTaskNotFound(taskId);
      }
    }
  }

  Future<void> _showNotificationTaskDetailsModal(TaskModel task) async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.25),
      builder: (context) => _TaskDetailsModalSheet(
        task: task,
        selectedDate: selectedDate,
        user: user,
      ),
    );

    if (mounted) {
      ref.read(notificationNavigationProvider.notifier).reset();
      _isProcessingNotification = false;
    }
  }

  Future<void> _showAddTaskModal() async {
    final added = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.25),
      builder: (context) => _AddTaskModalSheet(selectedDate: selectedDate),
    );

    if (added != null && added) {
      await ref.read(fetchUsersProvider.notifier).fetchUsers();
      await ref
          .read(getTaskListProvider.notifier)
          .refreshCurrentMonth(
            groomId: user.accountType == AccountType.groomer ? user.id : null,
            boarderId: user.accountType == AccountType.boarder ? user.id : null,
            barnId: user.barnId,
          );
    }
  }

  Future<void> _handleNotificationNavigation(
    NotificationNavigationState? previous,
    NotificationNavigationState next,
  ) async {
    if (!mounted) return;

    if (next is InitialNotificationNavigationState ||
        _isProcessingNotification ||
        (previous is NavigateToTaskState && next is NavigateToTaskState)) {
      return;
    }

    if (!mounted || _isProcessingNotification) return;

    switch (next) {
      case NavigateToTaskState(:final taskId, :final targetDate):
        if (_isProcessingNotification) return;
        _isProcessingNotification = true;

        setState(() {
          selectedDate = targetDate;
          focusedDate = targetDate;
        });

        await ref.read(fetchUsersProvider.notifier).fetchUsers();
        await ref
            .read(getTaskListProvider.notifier)
            .getTasksForDate(
              date: targetDate,
              groomId: user.accountType == AccountType.groomer ? user.id : null,
              boarderId: user.accountType == AccountType.boarder
                  ? user.id
                  : null,
              barnId: user.barnId,
            );

        if (!mounted) return;

        _handleNotificationTaskNavigation(taskId);

      case TaskNotFoundState():
        if (_isProcessingNotification) return;
        _isProcessingNotification = true;

        context.showError(
          title: context.l10n.taskNotFound,
          subtitle: context.l10n.taskNotFoundDescription,
        );

        ref.read(notificationNavigationProvider.notifier).reset();
        _isProcessingNotification = false;

      case InitialNotificationNavigationState():
        _isProcessingNotification = false;
      case NavigateToInvoiceState():
        _isProcessingNotification = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(notificationNavigationProvider, _handleNotificationNavigation);
    final primary = context.primaryColor;
    final taskListState = ref.watch(getTaskListProvider);
    final deleteTaskState = ref.watch(deleteTaskProvider);

    ref.listen<DeleteTaskState>(deleteTaskProvider, (previous, next) {
      if (next is SuccessDeleteTaskState) {
        context.showSuccess(title: context.l10n.taskDeletedSuccessfully);
      } else if (next is ErrorDeleteTaskState) {
        context.showError(
          title: context.l10n.failedToDeleteTask,
          subtitle: context.l10n.pleaseTryAgain,
        );
      }
    });

    final isLoading =
        taskListState is InitialGetTaskListState ||
        taskListState is LoadingGetTaskListState ||
        deleteTaskState is LoadingDeleteTaskState;
    // Helpers
    DateTime startOfDay(DateTime d) => DateTime(d.year, d.month, d.day);
    DateTime endOfDay(DateTime d) =>
        DateTime(d.year, d.month, d.day, 23, 59, 59, 999);

    final rawTasks = ref
        .read(getTaskListProvider.notifier)
        .getTasksFromState(selectedDate);

    final allTasks = rawTasks
        .map(
          (task) => (task.dueDate.hour == 0 && task.dueDate.minute == 0)
              ? task.copyWith(
                  dueDate: DateTime(
                    task.dueDate.year,
                    task.dueDate.month,
                    task.dueDate.day,
                    23,
                    59,
                  ),
                )
              : task,
        )
        .toList();

    final DateTime todayStart = startOfDay(DateTime.now());
    final DateTime dayStart = startOfDay(selectedDate);
    final DateTime dayEnd = endOfDay(selectedDate);

    final query = searchController.text.trim().toLowerCase();

    bool matchesQuery(TaskModel task) {
      if (query.isEmpty) return true;
      final q = query.toLowerCase();
      final matchesTaskName = task.name.toLowerCase().contains(q);
      final matchesHorseName = task.horses.any(
        (horse) => horse.name.toLowerCase().contains(q),
      );
      return matchesTaskName || matchesHorseName;
    }

    bool isOnSelectedDay(DateTime due) =>
        !due.isBefore(dayStart) && !due.isAfter(dayEnd);

    bool isOverdueAsOfToday(TaskModel task) =>
        task.dueDate.isBefore(todayStart) &&
        task.status != TaskStatus.completed;

    final displayedTasks = allTasks.where(
      (task) {
        final onSelectedDay = isOnSelectedDay(task.dueDate);
        final overdueAsOfToday =
            isOverdueAsOfToday(task) || task.status == TaskStatus.overdue;
        final matchesQuery2 = matchesQuery(task);
        return (onSelectedDay || overdueAsOfToday) && matchesQuery2;
      },
    ).toList()..sort((a, b) => a.dueDate.compareTo(b.dueDate));

    final taskDates = allTasks
        .map((t) => startOfDay(t.dueDate))
        .toSet()
        .toList();
    return Scaffold(
      appBar: const GLAuthUserAppBar(),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(getBoarderHorsesProvider.notifier).load();
          await ref.read(fetchHorsesProvider.notifier).fetchAllHorses();
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
        child: ListView(
          padding: 16.edgeInsetsH,
          clipBehavior: Clip.none,
          children: [
            if (widget.showGreeting) ...[
              GLWelcomeGreeting(user: user),
              GLSpaces.px16,
            ],
            if (user.isBoarder) ...[const BoarderHorsesSection()],
            if (_monthNames.isNotEmpty) ...[
              MonthSelector(
                monthNames: _monthNames,
                focusedDate: focusedDate,
                onChanged: _onSelectMonth,
                onPrev: _onPrevMonth,
                onNext: _onNextMonth,
              ),
              GLSpaces.px24,
            ],
            TaskCalendarWidget(
              focusedDate: focusedDate,
              selectedDate: selectedDate,
              primary: primary,
              onDaySelected: _onDaySelected,
              taskDates: user.accountType != AccountType.groomer
                  ? []
                  : taskDates,
            ),
            GLSpaces.px16,
            _SectionHeaderWithAdd(
              user: user,
              title: context.l10n.tasksOnDate(
                selectedDate.monthDayForLocale(context.l10n.localeName),
              ),
              onAdd: _showAddTaskModal,
              primary: primary,
            ),
            GLSpaces.px32,
            _TasksSearchField(
              controller: searchController,
              hintText: context.l10n.searchTasks,
              onChanged: (_) => setState(() {}),
            ),
            GLSpaces.px16,
            if (isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              )
            else
              _TaskListView(
                tasks: displayedTasks,
                selectedDate: selectedDate,
                user: user,
              ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeaderWithAdd extends StatelessWidget {
  const _SectionHeaderWithAdd({
    required this.user,
    required this.title,
    required this.onAdd,
    required this.primary,
  });

  final GLUser user;
  final String title;
  final VoidCallback onAdd;
  final Color primary;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: context.headlineSmall),
        if (user.accountType != AccountType.boarder) ...[
          InkWell(
            onTap: onAdd,
            borderRadius: BorderRadius.circular(100),
            child: Container(
              height: 30,
              width: 30,
              decoration: BoxDecoration(shape: BoxShape.circle, color: primary),
              child: const Center(
                child: Icon(Icons.add, color: Colors.white, size: 20),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _TasksSearchField extends StatelessWidget {
  const _TasksSearchField({
    required this.controller,
    required this.hintText,
    this.onChanged,
  });

  final TextEditingController controller;
  final String hintText;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        prefixIcon: const Icon(GLIcons.seach),
        hintText: hintText,
      ),
    );
  }
}

class _TaskListView extends StatelessWidget {
  const _TaskListView({
    required this.tasks,
    required this.selectedDate,
    required this.user,
  });

  final List<TaskModel> tasks;
  final DateTime selectedDate;
  final GLUser user;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    if (tasks.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.noTasksOnThisDay, style: context.titleMedium),
          Text(
            l10n.noTasksScheduledForSelectedDate,
            style: context.titleSmall.copyWith(color: context.hintColor),
          ),
          GLSpaces.px32,
        ],
      );
    }

    final sortedTasks = [...tasks]
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));

    return ListView.builder(
      key: const PageStorageKey('tasks-list'),
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: sortedTasks.length,
      itemBuilder: (context, index) {
        final task = sortedTasks[index];
        return TaskCardTile(
          task: task,
          onTap: () {
            _showTaskDetailsModal(task, context, user);
          },
        );
      },
    );
  }

  Future<void> _showTaskDetailsModal(
    TaskModel task,
    BuildContext context,
    GLUser user,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.25),
      builder: (context) => _TaskDetailsModalSheet(
        task: task,
        selectedDate: selectedDate,
        user: user,
      ),
    );
  }
}

class _AddTaskModalSheet extends ConsumerWidget {
  const _AddTaskModalSheet({required this.selectedDate});

  final DateTime selectedDate;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
      child: Material(
        color: Colors.transparent,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: 16.borderRadiusT,
            boxShadow: [
              BoxShadow(
                color: context.shadowColor,
                offset: const Offset(0, -1),
                blurRadius: 50,
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: AddTaskForm(createdAt: selectedDate),
          ),
        ),
      ),
    );
  }
}

class _TaskDetailsModalSheet extends ConsumerWidget {
  const _TaskDetailsModalSheet({
    required this.task,
    required this.selectedDate,
    required this.user,
  });

  final TaskModel task;
  final DateTime selectedDate;
  final GLUser user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
      child: Material(
        color: Colors.transparent,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: 16.borderRadiusT,
            boxShadow: [
              BoxShadow(
                color: context.shadowColor,
                offset: const Offset(0, -1),
                blurRadius: 50,
              ),
            ],
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
                await ref.read(fetchUsersProvider.notifier).fetchUsers();
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
                await ref.read(deleteTaskProvider.notifier).deleteTask(task.id);
              },
            ),
          ),
        ),
      ),
    );
  }
}
