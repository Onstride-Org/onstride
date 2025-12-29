import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/tasks/providers/create_task/create_task_state.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:tasks_repository/tasks_repository.dart';

part 'create_task.g.dart';

@riverpod
class CreateTask extends _$CreateTask {
  TasksRepository get _repo => ref.read(tasksRepositoryProvider);

  @override
  CreateTaskState build() => const CreateTaskState.initial();

  Future<TaskModel?> create(TaskModel task) async {
    try {
      state = const CreateTaskState.loading();
      final created = await _repo.createTask(task: task);
      state = CreateTaskState.success(task: created);
      return created;
    } catch (e) {
      state = CreateTaskState.error(message: e.toString());
      return null;
    }
  }
}
