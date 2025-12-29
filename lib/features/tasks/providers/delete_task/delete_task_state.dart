import 'package:freezed_annotation/freezed_annotation.dart';

part 'delete_task_state.freezed.dart';

@freezed
sealed class DeleteTaskState with _$DeleteTaskState {
  const factory DeleteTaskState.initial() = InitialDeleteTaskState;

  const factory DeleteTaskState.loading({required String taskId}) =
      LoadingDeleteTaskState;

  const factory DeleteTaskState.success({required String taskId}) =
      SuccessDeleteTaskState;

  const factory DeleteTaskState.error({
    required String taskId,
    required String message,
  }) = ErrorDeleteTaskState;
}
