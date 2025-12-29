import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'lesson_requests_state.freezed.dart';

@freezed
sealed class FetchLessonRequestsState with _$FetchLessonRequestsState {
  const factory FetchLessonRequestsState.initial() =
      InitialFetchLessonRequestsState;
  const factory FetchLessonRequestsState.loading() =
      LoadingFetchLessonRequestsState;
  const factory FetchLessonRequestsState.success({
    required List<LessonRequestModel> requests,
  }) = SuccessFetchLessonRequestsState;
  const factory FetchLessonRequestsState.error({required String message}) =
      ErrorFetchLessonRequestsState;
}

@freezed
sealed class RespondToRequestState with _$RespondToRequestState {
  const factory RespondToRequestState.initial() = InitialRespondToRequestState;
  const factory RespondToRequestState.loading() = LoadingRespondToRequestState;
  const factory RespondToRequestState.success({
    required LessonRequestModel request,
  }) = SuccessRespondToRequestState;
  const factory RespondToRequestState.error({required String message}) =
      ErrorRespondToRequestState;
}

@freezed
sealed class CreateLessonRequestState with _$CreateLessonRequestState {
  const factory CreateLessonRequestState.initial() =
      InitialCreateLessonRequestState;
  const factory CreateLessonRequestState.loading() =
      LoadingCreateLessonRequestState;
  const factory CreateLessonRequestState.success({
    required LessonRequestModel request,
  }) = SuccessCreateLessonRequestState;
  const factory CreateLessonRequestState.error({required String message}) =
      ErrorCreateLessonRequestState;
}
