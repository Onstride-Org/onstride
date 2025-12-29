import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'trainer_availability.freezed.dart';
part 'trainer_availability.g.dart';

/// Time slot for trainer availability.
@freezed
sealed class TimeSlot with _$TimeSlot {
  const factory TimeSlot({
    /// Start hour (0-23)
    required int startHour,
    /// Start minute (0-59)
    required int startMinute,
    /// End hour (0-23)
    required int endHour,
    /// End minute (0-59)
    required int endMinute,
  }) = _TimeSlot;

  factory TimeSlot.fromJson(Map<String, dynamic> json) =>
      _$TimeSlotFromJson(json);
}

extension TimeSlotX on TimeSlot {
  String get startFormatted {
    final h = startHour % 12 == 0 ? 12 : startHour % 12;
    final m = startMinute.toString().padLeft(2, '0');
    final period = startHour < 12 ? 'AM' : 'PM';
    return '$h:$m $period';
  }

  String get endFormatted {
    final h = endHour % 12 == 0 ? 12 : endHour % 12;
    final m = endMinute.toString().padLeft(2, '0');
    final period = endHour < 12 ? 'AM' : 'PM';
    return '$h:$m $period';
  }

  int get durationMinutes {
    final startTotal = startHour * 60 + startMinute;
    final endTotal = endHour * 60 + endMinute;
    return endTotal - startTotal;
  }
}

/// Daily availability settings for a trainer.
@freezed
sealed class DayAvailability with _$DayAvailability {
  const factory DayAvailability({
    /// Day of week (0=Sunday, 6=Saturday)
    required int dayOfWeek,
    /// Whether the trainer is available this day
    @Default(false) bool isAvailable,
    /// Time slots available on this day
    @Default(<TimeSlot>[]) List<TimeSlot> slots,
  }) = _DayAvailability;

  factory DayAvailability.fromJson(Map<String, dynamic> json) =>
      _$DayAvailabilityFromJson(json);
}

extension DayAvailabilityX on DayAvailability {
  String get dayName {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];
    return days[dayOfWeek];
  }

  String get shortDayName {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayOfWeek];
  }
}

/// Trainer availability settings.
@freezed
sealed class TrainerAvailability with _$TrainerAvailability {
  const factory TrainerAvailability({
    required String id,
    required String trainerId,
    required String barnId,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime updatedAt,
    /// Weekly availability by day
    @Default(<DayAvailability>[]) List<DayAvailability> weeklySchedule,
    /// Lesson types this trainer offers
    @Default(<LessonType>[]) List<LessonType> offeredLessonTypes,
    /// Default lesson duration in minutes
    @Default(60) int defaultDurationMinutes,
    /// Default price per lesson
    @Default(0.0) double defaultPrice,
    /// Minimum booking notice in hours
    @Default(24) int minBookingNoticeHours,
    /// Maximum advance booking in days
    @Default(60) int maxAdvanceBookingDays,
    /// Available horses for lessons
    @Default(<String>[]) List<String> availableHorseIds,
    /// Locations where trainer can teach
    @Default(<String>[]) List<String> locations,
    /// Whether clients can self-book without approval
    @Default(false) bool allowSelfBooking,
    /// Notes or special instructions
    String? notes,
  }) = _TrainerAvailability;

  factory TrainerAvailability.fromJson(Map<String, dynamic> json) =>
      _$TrainerAvailabilityFromJson(json);
}

extension TrainerAvailabilityX on TrainerAvailability {
  /// Returns availability for a specific day of week.
  DayAvailability? getAvailabilityForDay(int dayOfWeek) {
    return weeklySchedule.where((d) => d.dayOfWeek == dayOfWeek).firstOrNull;
  }

  /// Check if a specific date/time is available.
  bool isTimeAvailable(DateTime dateTime, int durationMinutes) {
    final dayAvail = getAvailabilityForDay(dateTime.weekday % 7);
    if (dayAvail == null || !dayAvail.isAvailable) return false;

    final requestHour = dateTime.hour;
    final requestMinute = dateTime.minute;
    final endMinutes = requestHour * 60 + requestMinute + durationMinutes;

    for (final slot in dayAvail.slots) {
      final slotStart = slot.startHour * 60 + slot.startMinute;
      final slotEnd = slot.endHour * 60 + slot.endMinute;
      final requestStart = requestHour * 60 + requestMinute;

      if (requestStart >= slotStart && endMinutes <= slotEnd) {
        return true;
      }
    }
    return false;
  }

  /// Get list of available days as day names.
  List<String> get availableDayNames {
    return weeklySchedule
        .where((d) => d.isAvailable)
        .map((d) => d.dayName)
        .toList();
  }
}
