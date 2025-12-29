import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'update_task_state.freezed.dart';

@freezed
sealed class UpdateTaskState with _$UpdateTaskState {
  const factory UpdateTaskState.initial() = InitialUpdateTaskState;
  const factory UpdateTaskState.loading() = LoadingUpdateTaskState;
  const factory UpdateTaskState.success({required TaskModel task}) =
      SuccessUpdateTaskState;
  const factory UpdateTaskState.error({required String message}) =
      ErrorUpdateTaskState;
}
