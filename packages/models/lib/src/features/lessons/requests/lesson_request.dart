import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'lesson_request.freezed.dart';
part 'lesson_request.g.dart';

/// Request payload for creating a new lesson request.
@freezed
sealed class CreateLessonRequestPayload with _$CreateLessonRequestPayload {
  const factory CreateLessonRequestPayload({
    required String barnId,
    required String trainerId,
    required String clientId,
    required RequestInitiator initiatedBy,
    @TimestampConverter() required DateTime proposedDate,
    required int proposedDuration,
    required LessonType lessonType,
    String? horseId,
    String? horseName,
    String? trainerName,
    String? clientName,
    String? location,
    String? notes,
    @Default(0.0) double price,
  }) = _CreateLessonRequestPayload;

  factory CreateLessonRequestPayload.fromJson(Map<String, dynamic> json) =>
      _$CreateLessonRequestPayloadFromJson(json);
}

/// Request payload for responding to a lesson request.
@freezed
sealed class LessonRequestResponse with _$LessonRequestResponse {
  const factory LessonRequestResponse({
    required String requestId,
    required LessonStatus newStatus,
    String? responseMessage,
    /// For counter proposals
    @NullableTimestampConverter() DateTime? counterProposedDate,
    int? counterProposedDuration,
    String? counterNotes,
  }) = _LessonRequestResponse;

  factory LessonRequestResponse.fromJson(Map<String, dynamic> json) =>
      _$LessonRequestResponseFromJson(json);
}

/// Request payload for creating a lesson directly (trainer-initiated or approved request).
@freezed
sealed class CreateLessonPayload with _$CreateLessonPayload {
  const factory CreateLessonPayload({
    required String barnId,
    required String trainerId,
    required String clientId,
    @TimestampConverter() required DateTime scheduledDate,
    required int durationMinutes,
    required LessonType type,
    String? horseId,
    String? horseName,
    String? trainerName,
    String? clientName,
    String? location,
    String? notes,
    @Default(0.0) double price,
    String? requestId,
    /// For recurring lessons
    RecurrenceType? recurrenceType,
    @Default(<int>[]) List<int> recurrenceDays,
    @NullableTimestampConverter() DateTime? recurrenceEndDate,
    int? recurrenceCount,
  }) = _CreateLessonPayload;

  factory CreateLessonPayload.fromJson(Map<String, dynamic> json) =>
      _$CreateLessonPayloadFromJson(json);
}

extension CreateLessonPayloadX on CreateLessonPayload {
  List<String> get searchTerms => [
        trainerId,
        clientId,
        if (horseName != null) horseName!,
        if (trainerName != null) trainerName!,
        if (clientName != null) clientName!,
        if (location != null) location!,
      ];
}
