import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'lesson_request_model.freezed.dart';
part 'lesson_request_model.g.dart';

/// Who initiated the lesson request.
enum RequestInitiator {
  client,
  trainer,
}

/// A lesson request in the negotiation workflow.
@freezed
sealed class LessonRequestModel with _$LessonRequestModel {
  const factory LessonRequestModel({
    required String id,
    required String barnId,
    required String trainerId,
    required String clientId,
    required RequestInitiator initiatedBy,
    required LessonStatus status,
    @TimestampConverter() required DateTime proposedDate,
    required int proposedDuration,
    required LessonType lessonType,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime updatedAt,
    String? horseId,
    String? horseName,
    String? trainerName,
    String? clientName,
    String? location,
    String? notes,
    @Default(0.0) double price,
    /// Counter proposal details
    @NullableTimestampConverter() DateTime? counterProposedDate,
    int? counterProposedDuration,
    String? counterNotes,
    String? counterBy,
    /// Response details
    String? responseMessage,
    String? rejectionReason,
    @NullableTimestampConverter() DateTime? respondedAt,
    /// Resulting lesson ID once approved
    String? lessonId,
    @NullableTimestampConverter() DateTime? deletedAt,
  }) = _LessonRequestModel;

  factory LessonRequestModel.fromJson(Map<String, dynamic> json) =>
      _$LessonRequestModelFromJson(json);
}

extension LessonRequestModelX on LessonRequestModel {
  bool get isPending =>
      status == LessonStatus.requested || status == LessonStatus.countered;

  bool get needsClientResponse =>
      status == LessonStatus.countered &&
      initiatedBy == RequestInitiator.client;

  bool get needsTrainerResponse =>
      (status == LessonStatus.requested &&
          initiatedBy == RequestInitiator.client) ||
      (status == LessonStatus.countered &&
          initiatedBy == RequestInitiator.trainer);

  DateTime get effectiveDate => counterProposedDate ?? proposedDate;

  int get effectiveDuration => counterProposedDuration ?? proposedDuration;

  String get durationFormatted {
    final minutes = effectiveDuration;
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? '${hours}h ${mins}m' : '${hours}h';
    }
    return '${mins}m';
  }
}
