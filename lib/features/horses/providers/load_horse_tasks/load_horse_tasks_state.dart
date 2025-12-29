import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'load_horse_tasks_state.freezed.dart';

@freezed
sealed class LoadHorseTasksState with _$LoadHorseTasksState {
  const factory LoadHorseTasksState.initial() = InitialLoadHorseTasksState;

  const factory LoadHorseTasksState.loading() = LoadingLoadHorseTasksState;

  const factory LoadHorseTasksState.success({required List<TaskModel> tasks}) =
      SuccessLoadHorseTasksState;

  const factory LoadHorseTasksState.error({
    required DataProviderException exception,
  }) = ErrorLoadHorseTasksState;
}

extension LoadHorsesTasksExtension on LoadHorseTasksState {
  List<TaskModel> get allTasks {
    final state = this;
    if (state is SuccessLoadHorseTasksState) return state.tasks;
    return [];
  }

  List<TaskModel> get pendingTasks {
    final state = this;
    if (state is SuccessLoadHorseTasksState) {
      return state.tasks
          .where((task) => task.status == TaskStatus.notStarted)
          .toList();
    }
    return [];
  }
}
