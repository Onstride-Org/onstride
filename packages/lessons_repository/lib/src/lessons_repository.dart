import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';

/// Repository for managing lessons and lesson requests.
class LessonsRepository {
  LessonsRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  // ============ LESSON REQUESTS ============

  /// Creates a new lesson request.
  Future<LessonRequestModel> createLessonRequest(
      CreateLessonRequestPayload payload) {
    return dataProviderClient.lessonsResource.createLessonRequest(payload);
  }

  /// Gets lesson requests for a trainer (their inbox).
  Future<List<LessonRequestModel>> getTrainerLessonRequests({
    required String trainerId,
    required String barnId,
    LessonStatus? statusFilter,
  }) {
    return dataProviderClient.lessonsResource.getTrainerLessonRequests(
      trainerId: trainerId,
      barnId: barnId,
      statusFilter: statusFilter,
    );
  }

  /// Gets lesson requests for a client.
  Future<List<LessonRequestModel>> getClientLessonRequests({
    required String clientId,
    required String barnId,
    LessonStatus? statusFilter,
  }) {
    return dataProviderClient.lessonsResource.getClientLessonRequests(
      clientId: clientId,
      barnId: barnId,
      statusFilter: statusFilter,
    );
  }

  /// Gets a single lesson request by ID.
  Future<LessonRequestModel> getLessonRequest({
    required String id,
    required String barnId,
  }) {
    return dataProviderClient.lessonsResource.getLessonRequest(
      id: id,
      barnId: barnId,
    );
  }

  /// Responds to a lesson request.
  Future<LessonRequestModel> respondToLessonRequest({
    required String requestId,
    required String barnId,
    required LessonRequestResponse response,
    required String responderId,
  }) {
    return dataProviderClient.lessonsResource.respondToLessonRequest(
      requestId: requestId,
      barnId: barnId,
      response: response,
      responderId: responderId,
    );
  }

  /// Deletes a lesson request.
  Future<void> deleteLessonRequest({
    required String id,
    required String barnId,
    required String deletedBy,
  }) {
    return dataProviderClient.lessonsResource.deleteLessonRequest(
      id: id,
      barnId: barnId,
      deletedBy: deletedBy,
    );
  }

  // ============ LESSONS ============

  /// Creates a new lesson.
  Future<LessonModel> createLesson(CreateLessonPayload payload) {
    return dataProviderClient.lessonsResource.createLesson(payload);
  }

  /// Gets lessons for a trainer.
  Future<List<LessonModel>> getTrainerLessons({
    required String trainerId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  }) {
    return dataProviderClient.lessonsResource.getTrainerLessons(
      trainerId: trainerId,
      barnId: barnId,
      startDate: startDate,
      endDate: endDate,
      statusFilter: statusFilter,
    );
  }

  /// Gets lessons for a client.
  Future<List<LessonModel>> getClientLessons({
    required String clientId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  }) {
    return dataProviderClient.lessonsResource.getClientLessons(
      clientId: clientId,
      barnId: barnId,
      startDate: startDate,
      endDate: endDate,
      statusFilter: statusFilter,
    );
  }

  /// Gets all lessons for a barn.
  Future<List<LessonModel>> getBarnLessons({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  }) {
    return dataProviderClient.lessonsResource.getBarnLessons(
      barnId: barnId,
      startDate: startDate,
      endDate: endDate,
      statusFilter: statusFilter,
    );
  }

  /// Gets a single lesson.
  Future<LessonModel> getLesson({
    required String id,
    required String barnId,
  }) {
    return dataProviderClient.lessonsResource.getLesson(
      id: id,
      barnId: barnId,
    );
  }

  /// Updates a lesson.
  Future<LessonModel> updateLesson({required LessonModel lesson}) {
    return dataProviderClient.lessonsResource.updateLesson(lesson: lesson);
  }

  /// Cancels a lesson.
  Future<LessonModel> cancelLesson({
    required String id,
    required String barnId,
    required String cancelledBy,
    String? reason,
  }) {
    return dataProviderClient.lessonsResource.cancelLesson(
      id: id,
      barnId: barnId,
      cancelledBy: cancelledBy,
      reason: reason,
    );
  }

  /// Marks a lesson as completed.
  Future<LessonModel> completeLesson({
    required String id,
    required String barnId,
  }) {
    return dataProviderClient.lessonsResource.completeLesson(
      id: id,
      barnId: barnId,
    );
  }

  /// Deletes a lesson.
  Future<void> deleteLesson({
    required String id,
    required String barnId,
    required String deletedBy,
  }) {
    return dataProviderClient.lessonsResource.deleteLesson(
      id: id,
      barnId: barnId,
      deletedBy: deletedBy,
    );
  }

  // ============ TRAINER AVAILABILITY ============

  /// Gets trainer availability settings.
  Future<TrainerAvailability?> getTrainerAvailability({
    required String trainerId,
    required String barnId,
  }) {
    return dataProviderClient.lessonsResource.getTrainerAvailability(
      trainerId: trainerId,
      barnId: barnId,
    );
  }

  /// Saves trainer availability settings.
  Future<TrainerAvailability> saveTrainerAvailability(
      TrainerAvailability availability) {
    return dataProviderClient.lessonsResource
        .saveTrainerAvailability(availability);
  }

  // ============ RECURRING LESSONS ============

  /// Gets recurring lesson templates.
  Future<List<LessonModel>> getRecurringTemplates({
    required String trainerId,
    required String barnId,
  }) {
    return dataProviderClient.lessonsResource.getRecurringTemplates(
      trainerId: trainerId,
      barnId: barnId,
    );
  }

  /// Generates lesson instances from a recurring template.
  Future<List<LessonModel>> generateRecurringInstances({
    required String templateId,
    required String barnId,
    required DateTime untilDate,
  }) {
    return dataProviderClient.lessonsResource.generateRecurringInstances(
      templateId: templateId,
      barnId: barnId,
      untilDate: untilDate,
    );
  }
}
