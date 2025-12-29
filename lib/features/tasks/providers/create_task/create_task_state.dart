import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'create_task_state.freezed.dart';

@freezed
sealed class CreateTaskState with _$CreateTaskState {
  const factory CreateTaskState.initial() = InitialCreateTaskState;
  const factory CreateTaskState.loading() = LoadingCreateTaskState;
  const factory CreateTaskState.success({required TaskModel task}) =
      SuccessCreateTaskState;
  const factory CreateTaskState.error({required String message}) =
      ErrorCreateTaskState;
}
