import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/tasks/providers/load_task/load_task_state.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:tasks_repository/tasks_repository.dart';

part 'load_task.g.dart';

@riverpod
class LoadTask extends _$LoadTask {
  TasksRepository get _repo => ref.read(tasksRepositoryProvider);

  @override
  LoadTaskState build() => const LoadTaskState.initial();

  Future<void> loadTask(String id) async {
    try {
      state = const LoadTaskState.loading();
      final task = await _repo.fetchAndUpdateTask(id: id);
      state = LoadTaskState.success(task: task);
    } catch (e) {
      state = LoadTaskState.error(message: e.toString());
    }
  }
}
