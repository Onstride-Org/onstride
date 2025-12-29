import 'package:models/models.dart';

/// {@template lessons_resource}
/// Data source abstraction for managing lessons and lesson requests.
/// Responsible for:
///   - Creating and managing lesson requests (two-way negotiation)
///   - Creating and managing scheduled lessons
///   - Managing trainer availability
///   - Generating recurring lesson instances
/// {@endtemplate}
abstract class LessonsResource {
  /// {@macro lessons_resource}
  const LessonsResource();

  // ============ LESSON REQUESTS ============

  /// Creates a new lesson request (client or trainer initiated).
  Future<LessonRequestModel> createLessonRequest(
      CreateLessonRequestPayload payload);

  /// Fetches lesson requests for a trainer (their inbox).
  Future<List<LessonRequestModel>> getTrainerLessonRequests({
    required String trainerId,
    required String barnId,
    LessonStatus? statusFilter,
  });

  /// Fetches lesson requests for a client.
  Future<List<LessonRequestModel>> getClientLessonRequests({
    required String clientId,
    required String barnId,
    LessonStatus? statusFilter,
  });

  /// Gets a single lesson request by ID.
  Future<LessonRequestModel> getLessonRequest({
    required String id,
    required String barnId,
  });

  /// Responds to a lesson request (approve, reject, or counter).
  Future<LessonRequestModel> respondToLessonRequest({
    required String requestId,
    required String barnId,
    required LessonRequestResponse response,
    required String responderId,
  });

  /// Deletes/cancels a lesson request.
  Future<void> deleteLessonRequest({
    required String id,
    required String barnId,
    required String deletedBy,
  });

  // ============ LESSONS ============

  /// Creates a new lesson directly (or from an approved request).
  Future<LessonModel> createLesson(CreateLessonPayload payload);

  /// Fetches lessons for a trainer.
  Future<List<LessonModel>> getTrainerLessons({
    required String trainerId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  });

  /// Fetches lessons for a client.
  Future<List<LessonModel>> getClientLessons({
    required String clientId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  });

  /// Fetches all lessons for a barn.
  Future<List<LessonModel>> getBarnLessons({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  });

  /// Gets a single lesson by ID.
  Future<LessonModel> getLesson({
    required String id,
    required String barnId,
  });

  /// Updates an existing lesson.
  Future<LessonModel> updateLesson({required LessonModel lesson});

  /// Cancels a lesson.
  Future<LessonModel> cancelLesson({
    required String id,
    required String barnId,
    required String cancelledBy,
    String? reason,
  });

  /// Marks a lesson as completed.
  Future<LessonModel> completeLesson({
    required String id,
    required String barnId,
  });

  /// Deletes a lesson (soft delete).
  Future<void> deleteLesson({
    required String id,
    required String barnId,
    required String deletedBy,
  });

  // ============ TRAINER AVAILABILITY ============

  /// Gets trainer availability settings.
  Future<TrainerAvailability?> getTrainerAvailability({
    required String trainerId,
    required String barnId,
  });

  /// Creates or updates trainer availability.
  Future<TrainerAvailability> saveTrainerAvailability(
      TrainerAvailability availability);

  // ============ RECURRING LESSONS ============

  /// Gets recurring lesson templates for a trainer.
  Future<List<LessonModel>> getRecurringTemplates({
    required String trainerId,
    required String barnId,
  });

  /// Generates lesson instances for a recurring template.
  Future<List<LessonModel>> generateRecurringInstances({
    required String templateId,
    required String barnId,
    required DateTime untilDate,
  });
}
