import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'load_task_state.freezed.dart';

@freezed
sealed class LoadTaskState with _$LoadTaskState {
  const factory LoadTaskState.initial() = InitialLoadTaskState;
  const factory LoadTaskState.loading() = LoadingLoadTaskState;
  const factory LoadTaskState.success({required TaskModel task}) =
      SuccessLoadTaskState;
  const factory LoadTaskState.error({required String message}) =
      ErrorLoadTaskState;
}
