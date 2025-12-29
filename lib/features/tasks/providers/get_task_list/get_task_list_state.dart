import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'get_task_list_state.freezed.dart';

@freezed
sealed class GetTaskListState with _$GetTaskListState {
  const factory GetTaskListState.initial() = InitialGetTaskListState;
  const factory GetTaskListState.loading() = LoadingGetTaskListState;
  const factory GetTaskListState.success({
    required List<TaskModel> tasks,
    required int currentMonth,
    required int currentYear,
  }) = SuccessGetTaskListState;
  const factory GetTaskListState.error({required String message}) =
      ErrorGetTaskListState;
}
