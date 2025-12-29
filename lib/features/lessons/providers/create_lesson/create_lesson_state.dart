import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'create_lesson_state.freezed.dart';

@freezed
sealed class CreateLessonState with _$CreateLessonState {
  const factory CreateLessonState.initial() = InitialCreateLessonState;
  const factory CreateLessonState.loading() = LoadingCreateLessonState;
  const factory CreateLessonState.success({
    required LessonModel lesson,
  }) = SuccessCreateLessonState;
  const factory CreateLessonState.error({required String message}) =
      ErrorCreateLessonState;
}

@freezed
sealed class ManageLessonState with _$ManageLessonState {
  const factory ManageLessonState.initial() = InitialManageLessonState;
  const factory ManageLessonState.loading() = LoadingManageLessonState;
  const factory ManageLessonState.success({
    required LessonModel lesson,
  }) = SuccessManageLessonState;
  const factory ManageLessonState.deleted() = DeletedManageLessonState;
  const factory ManageLessonState.error({required String message}) =
      ErrorManageLessonState;
}
