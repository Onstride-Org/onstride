import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/tasks/providers/delete_task/delete_task_state.dart';
import 'package:gl_horses/features/tasks/providers/get_task_list/get_task_list.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:tasks_repository/tasks_repository.dart';

part 'delete_task.g.dart';

@riverpod
class DeleteTask extends _$DeleteTask {
  TasksRepository get _repo => ref.read(tasksRepositoryProvider);

  @override
  DeleteTaskState build() => const DeleteTaskState.initial();

  Future<bool> deleteTask(String taskId) async {
    try {
      state = DeleteTaskState.loading(taskId: taskId);

      await _repo.deleteTask(id: taskId);

      ref.read(getTaskListProvider.notifier).removeTask(taskId);

      state = DeleteTaskState.success(taskId: taskId);

      return true;
    } catch (e) {
      state = DeleteTaskState.error(
        taskId: taskId,
        message: e.toString(),
      );
      return false;
    }
  }

  void reset() {
    state = const DeleteTaskState.initial();
  }

  bool isTaskBeingDeleted(String taskId) {
    return state is LoadingDeleteTaskState &&
        (state as LoadingDeleteTaskState).taskId == taskId;
  }
}
