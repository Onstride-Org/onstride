import 'package:gl_horses/core/config/dependency_injection/repository/repository_providers.dart';
import 'package:gl_horses/features/lessons/providers/create_lesson/create_lesson_state.dart';
import 'package:lessons_repository/lessons_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'create_lesson.g.dart';

@riverpod
class CreateLesson extends _$CreateLesson {
  LessonsRepository get _repo => ref.read(lessonsRepositoryProvider);

  @override
  CreateLessonState build() => const CreateLessonState.initial();

  Future<LessonModel?> create(CreateLessonPayload payload) async {
    try {
      state = const CreateLessonState.loading();
      final lesson = await _repo.createLesson(payload);
      state = CreateLessonState.success(lesson: lesson);
      return lesson;
    } catch (e) {
      state = CreateLessonState.error(message: e.toString());
      return null;
    }
  }

  void reset() {
    state = const CreateLessonState.initial();
  }
}

@riverpod
class ManageLesson extends _$ManageLesson {
  LessonsRepository get _repo => ref.read(lessonsRepositoryProvider);

  @override
  ManageLessonState build() => const ManageLessonState.initial();

  Future<LessonModel?> update(LessonModel lesson) async {
    try {
      state = const ManageLessonState.loading();
      final updated = await _repo.updateLesson(lesson: lesson);
      state = ManageLessonState.success(lesson: updated);
      return updated;
    } catch (e) {
      state = ManageLessonState.error(message: e.toString());
      return null;
    }
  }

  Future<LessonModel?> cancel({
    required String id,
    required String barnId,
    required String cancelledBy,
    String? reason,
  }) async {
    try {
      state = const ManageLessonState.loading();
      final cancelled = await _repo.cancelLesson(
        id: id,
        barnId: barnId,
        cancelledBy: cancelledBy,
        reason: reason,
      );
      state = ManageLessonState.success(lesson: cancelled);
      return cancelled;
    } catch (e) {
      state = ManageLessonState.error(message: e.toString());
      return null;
    }
  }

  Future<LessonModel?> complete({
    required String id,
    required String barnId,
  }) async {
    try {
      state = const ManageLessonState.loading();
      final completed = await _repo.completeLesson(
        id: id,
        barnId: barnId,
      );
      state = ManageLessonState.success(lesson: completed);
      return completed;
    } catch (e) {
      state = ManageLessonState.error(message: e.toString());
      return null;
    }
  }

  Future<bool> delete({
    required String id,
    required String barnId,
    required String deletedBy,
  }) async {
    try {
      state = const ManageLessonState.loading();
      await _repo.deleteLesson(
        id: id,
        barnId: barnId,
        deletedBy: deletedBy,
      );
      state = const ManageLessonState.deleted();
      return true;
    } catch (e) {
      state = ManageLessonState.error(message: e.toString());
      return false;
    }
  }

  void reset() {
    state = const ManageLessonState.initial();
  }
}
