import 'package:data_provider_client/data_provider_client.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/horses/providers/load_horse_tasks/load_horse_tasks_state.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:tasks_repository/tasks_repository.dart';

part 'load_horse_tasks.g.dart';

@riverpod
class LoadHorseTasks extends _$LoadHorseTasks {
  TasksRepository get _repo => ref.read(tasksRepositoryProvider);

  @override
  LoadHorseTasksState build() => const LoadHorseTasksState.initial();

  Future<void> loadHorseTasks(String horseId) async {
    try {
      state = const LoadHorseTasksState.loading();
      final tasks = await _repo.fetchAndUpdateTasksByHorseId(horseId: horseId);
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
      await Future<void>.delayed(const Duration(seconds: 1));
      state = LoadHorseTasksState.success(tasks: updatedTasks);
    } on DataProviderException catch (e) {
      state = LoadHorseTasksState.error(exception: e);
    } catch (e) {
      state = const LoadHorseTasksState.error(
        exception: UnknownDataProviderException(),
      );
    }
  }
}
