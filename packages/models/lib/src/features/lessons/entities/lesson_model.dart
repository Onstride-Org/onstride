import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'lesson_model.freezed.dart';
part 'lesson_model.g.dart';

/// A scheduled lesson between a trainer and client.
@freezed
sealed class LessonModel with _$LessonModel {
  const factory LessonModel({
    required String id,
    required String barnId,
    required String trainerId,
    required String clientId,
    @TimestampConverter() required DateTime scheduledDate,
    required int durationMinutes,
    required LessonType type,
    required LessonStatus status,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime updatedAt,
    String? horseId,
    String? horseName,
    String? trainerName,
    String? clientName,
    String? location,
    String? notes,
    @Default(0.0) double price,
    /// Reference to the request that created this lesson
    String? requestId,
    /// For recurring lessons, reference to the parent template
    String? recurringTemplateId,
    /// If this is a recurring template, the recurrence settings
    RecurrenceType? recurrenceType,
    /// Days of week for recurring (0=Sunday, 6=Saturday)
    @Default(<int>[]) List<int> recurrenceDays,
    /// End date for recurring lessons
    @NullableTimestampConverter() DateTime? recurrenceEndDate,
    /// Number of occurrences for recurring lessons
    int? recurrenceCount,
    @NullableTimestampConverter() DateTime? deletedAt,
    String? deletedBy,
    String? cancellationReason,
  }) = _LessonModel;

  factory LessonModel.fromJson(Map<String, dynamic> json) =>
      _$LessonModelFromJson(json);
}

extension LessonModelX on LessonModel {
  String get durationFormatted {
    final hours = durationMinutes ~/ 60;
    final minutes = durationMinutes % 60;
    if (hours > 0) {
      return minutes > 0 ? '${hours}h ${minutes}m' : '${hours}h';
    }
    return '${minutes}m';
  }

  bool get isRecurring => recurringTemplateId != null || recurrenceType?.isRecurring == true;

  bool get canCancel => status == LessonStatus.approved || status == LessonStatus.requested;

  bool get canComplete => status == LessonStatus.approved;

  DateTime get endTime => scheduledDate.add(Duration(minutes: durationMinutes));
}
