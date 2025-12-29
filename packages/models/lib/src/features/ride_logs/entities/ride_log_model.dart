import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'ride_log_model.freezed.dart';
part 'ride_log_model.g.dart';

/// The type of ride logged
enum RideType {
  lesson,
  training,
  trail,
  lunging,
  groundwork,
  competition,
  other,
}

@freezed
sealed class RideLogModel with _$RideLogModel {
  const factory RideLogModel({
    required String id,
    required String horseId,
    required String barnId,
    @TimestampConverter() required DateTime date,
    required RideType type,
    required int durationMinutes,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime updatedAt,
    String? riderId,
    String? riderName,
    String? notes,
    String? createdById,
    @NullableTimestampConverter() DateTime? deletedAt,
    String? deletedBy,
  }) = _RideLogModel;

  factory RideLogModel.fromJson(Map<String, dynamic> json) =>
      _$RideLogModelFromJson(json);
}

@freezed
sealed class RideLogSummary with _$RideLogSummary {
  const factory RideLogSummary({
    required int totalRides,
    required int totalMinutes,
    required int ridesThisMonth,
    required int minutesThisMonth,
  }) = _RideLogSummary;

  factory RideLogSummary.fromJson(Map<String, dynamic> json) =>
      _$RideLogSummaryFromJson(json);
}

extension RideLogModelX on RideLogModel {
  String get durationFormatted {
    final hours = durationMinutes ~/ 60;
    final minutes = durationMinutes % 60;
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    return '${minutes}m';
  }
}

extension RideTypeX on RideType {
  String get displayName {
    switch (this) {
      case RideType.lesson:
        return 'Lesson';
      case RideType.training:
        return 'Training';
      case RideType.trail:
        return 'Trail Ride';
      case RideType.lunging:
        return 'Lunging';
      case RideType.groundwork:
        return 'Groundwork';
      case RideType.competition:
        return 'Competition';
      case RideType.other:
        return 'Other';
    }
  }
}
