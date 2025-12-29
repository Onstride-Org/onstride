import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'fetch_lessons_state.freezed.dart';

@freezed
sealed class FetchLessonsState with _$FetchLessonsState {
  const factory FetchLessonsState.initial() = InitialFetchLessonsState;
  const factory FetchLessonsState.loading() = LoadingFetchLessonsState;
  const factory FetchLessonsState.success({
    required List<LessonModel> lessons,
  }) = SuccessFetchLessonsState;
  const factory FetchLessonsState.error({required String message}) =
      ErrorFetchLessonsState;
}
