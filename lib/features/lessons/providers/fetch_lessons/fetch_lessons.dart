import 'package:gl_horses/core/config/dependency_injection/repository/repository_providers.dart';
import 'package:gl_horses/features/lessons/providers/fetch_lessons/fetch_lessons_state.dart';
import 'package:lessons_repository/lessons_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fetch_lessons.g.dart';

@riverpod
class FetchLessons extends _$FetchLessons {
  LessonsRepository get _repo => ref.read(lessonsRepositoryProvider);

  @override
  FetchLessonsState build() => const FetchLessonsState.initial();

  Future<void> fetchForTrainer({
    required String trainerId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  }) async {
    try {
      state = const FetchLessonsState.loading();
      final lessons = await _repo.getTrainerLessons(
        trainerId: trainerId,
        barnId: barnId,
        startDate: startDate,
        endDate: endDate,
        statusFilter: statusFilter,
      );
      state = FetchLessonsState.success(lessons: lessons);
    } catch (e) {
      state = FetchLessonsState.error(message: e.toString());
    }
  }

  Future<void> fetchForClient({
    required String clientId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  }) async {
    try {
      state = const FetchLessonsState.loading();
      final lessons = await _repo.getClientLessons(
        clientId: clientId,
        barnId: barnId,
        startDate: startDate,
        endDate: endDate,
        statusFilter: statusFilter,
      );
      state = FetchLessonsState.success(lessons: lessons);
    } catch (e) {
      state = FetchLessonsState.error(message: e.toString());
    }
  }

  Future<void> fetchForBarn({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  }) async {
    try {
      state = const FetchLessonsState.loading();
      final lessons = await _repo.getBarnLessons(
        barnId: barnId,
        startDate: startDate,
        endDate: endDate,
        statusFilter: statusFilter,
      );
      state = FetchLessonsState.success(lessons: lessons);
    } catch (e) {
      state = FetchLessonsState.error(message: e.toString());
    }
  }

  void addLesson(LessonModel lesson) {
    if (state is SuccessFetchLessonsState) {
      final currentState = state as SuccessFetchLessonsState;
      final updatedLessons = [lesson, ...currentState.lessons];
      updatedLessons.sort((a, b) => a.scheduledDate.compareTo(b.scheduledDate));
      state = FetchLessonsState.success(lessons: updatedLessons);
    }
  }

  void updateLesson(LessonModel lesson) {
    if (state is SuccessFetchLessonsState) {
      final currentState = state as SuccessFetchLessonsState;
      final updatedLessons = currentState.lessons
          .map((l) => l.id == lesson.id ? lesson : l)
          .toList();
      state = FetchLessonsState.success(lessons: updatedLessons);
    }
  }

  void removeLesson(String lessonId) {
    if (state is SuccessFetchLessonsState) {
      final currentState = state as SuccessFetchLessonsState;
      final updatedLessons = currentState.lessons
          .where((l) => l.id != lessonId)
          .toList();
      state = FetchLessonsState.success(lessons: updatedLessons);
    }
  }
}
