import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/tasks/providers/update_task/update_task_state.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:tasks_repository/tasks_repository.dart';

part 'update_task.g.dart';

@riverpod
class UpdateTask extends _$UpdateTask {
  TasksRepository get _repo => ref.read(tasksRepositoryProvider);

  @override
  UpdateTaskState build() => const UpdateTaskState.initial();

  Future<TaskModel?> update(TaskModel task) async {
    try {
      state = const UpdateTaskState.loading();
      final updated = await _repo.updateTask(task: task);
      state = UpdateTaskState.success(task: updated);
      return updated;
    } catch (e) {
      state = UpdateTaskState.error(message: e.toString());
      return null;
    }
  }
}
