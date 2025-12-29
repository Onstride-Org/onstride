import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/tasks/providers/get_task_list/get_task_list_state.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:tasks_repository/tasks_repository.dart';

part 'get_task_list.g.dart';

@riverpod
class GetTaskList extends _$GetTaskList {
  TasksRepository get _repo => ref.read(tasksRepositoryProvider);

  @override
  GetTaskListState build() => const GetTaskListState.initial();

  Future<void> getTaskList({
    DateTime? date,
    String? groomId,
    String? boarderId,
    String? barnId,
  }) async {
    try {
      state = const GetTaskListState.loading();
      final tasks = await _repo.fetchAndUpdateTasks(
        date: date,
        groomId: groomId,
        boarderId: boarderId,
        barnId: barnId,
      );
      final now = DateTime.now();
      final updatedTasks = tasks
          .map(
            (task) =>
                task.dueDate.isBefore(now) &&
                    task.status == TaskStatus.notStarted
                ? task.copyWith(status: TaskStatus.overdue)
                : task,
          )
          .toList();
      state = GetTaskListState.success(
        tasks: updatedTasks,
        currentMonth: date?.month ?? DateTime.now().month,
        currentYear: date?.year ?? DateTime.now().year,
      );
    } catch (e) {
      state = GetTaskListState.error(message: e.toString());
    }
  }

  bool _needsToFetchData(DateTime date) {
    if (state is! SuccessGetTaskListState) return true;

    final currentState = state as SuccessGetTaskListState;
    return currentState.currentMonth != date.month ||
        currentState.currentYear != date.year;
  }

  Future<void> getTasksForDate({
    required DateTime date,
    String? groomId,
    String? boarderId,
    String? barnId,
  }) async {
    if (_needsToFetchData(date)) {
      await getTaskList(
        date: date,
        groomId: groomId,
        boarderId: boarderId,
        barnId: barnId,
      );
    }
  }

  Future<void> refreshCurrentMonth({
    String? groomId,
    String? boarderId,
    String? barnId,
  }) async {
    if (state is! SuccessGetTaskListState) {
      await getTaskList(
        date: DateTime.now(),
        groomId: groomId,
        boarderId: boarderId,
        barnId: barnId,
      );
      return;
    }

    final currentState = state as SuccessGetTaskListState;
    final currentMonthDate = DateTime(
      currentState.currentYear,
      currentState.currentMonth,
    );

    await getTaskList(
      date: currentMonthDate,
      groomId: groomId,
      boarderId: boarderId,
      barnId: barnId,
    );
  }

  List<TaskModel> getTasksFromState(DateTime date) {
    if (state is! SuccessGetTaskListState) return [];

    final currentState = state as SuccessGetTaskListState;
    if (currentState.currentMonth != date.month ||
        currentState.currentYear != date.year) {
      return [];
    }

    return currentState.tasks;
  }

  void removeTask(String taskId) {
    if (state is SuccessGetTaskListState) {
      final currentState = state as SuccessGetTaskListState;
      final updatedTasks = currentState.tasks
          .where((task) => task.id != taskId)
          .toList();
      state = GetTaskListState.success(
        tasks: updatedTasks,
        currentMonth: currentState.currentMonth,
        currentYear: currentState.currentYear,
      );
    }
  }
}
