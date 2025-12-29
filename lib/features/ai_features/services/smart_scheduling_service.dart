import 'package:models/models.dart';

/// Service for generating smart scheduling suggestions.
///
/// This service analyzes horse workloads, trainer availability,
/// and existing schedules to provide optimal scheduling recommendations.
class SmartSchedulingService {
  /// Analyzes a horse's workload over the past week.
  HorseWorkloadAnalysis analyzeHorseWorkload({
    required HorseModel horse,
    required List<RideLogModel> recentRides,
    int recommendedMaxDaily = 60,
    int recommendedRestFrequency = 2,
  }) {
    final now = DateTime.now();
    final weekAgo = now.subtract(const Duration(days: 7));

    // Filter rides from the past 7 days
    final ridesLast7Days = recentRides
        .where((r) => r.date.isAfter(weekAgo))
        .toList();

    // Calculate total minutes
    final totalMinutes = ridesLast7Days.fold<int>(
      0,
      (sum, ride) => sum + ride.durationMinutes,
    );

    // Calculate average daily minutes
    final avgDaily = totalMinutes / 7.0;

    // Find days since last rest
    final rideDates = ridesLast7Days
        .map((r) => DateTime(r.date.year, r.date.month, r.date.day))
        .toSet()
        .toList()
      ..sort();

    int daysSinceRest = 0;
    if (rideDates.isNotEmpty) {
      // Count consecutive days with rides from today backwards
      var checkDate = DateTime(now.year, now.month, now.day);
      while (rideDates.contains(checkDate)) {
        daysSinceRest++;
        checkDate = checkDate.subtract(const Duration(days: 1));
      }
    }

    // Determine if horse needs rest
    final needsRest = daysSinceRest >= recommendedRestFrequency;

    // Determine workload status
    WorkloadStatus status;
    if (avgDaily < recommendedMaxDaily * 0.3) {
      status = WorkloadStatus.underworked;
    } else if (avgDaily < recommendedMaxDaily * 0.7) {
      status = WorkloadStatus.normal;
    } else if (avgDaily < recommendedMaxDaily) {
      status = WorkloadStatus.heavy;
    } else {
      status = WorkloadStatus.overworked;
    }

    return HorseWorkloadAnalysis(
      horseId: horse.id,
      horseName: horse.name,
      ridesLast7Days: ridesLast7Days.length,
      totalMinutesLast7Days: totalMinutes,
      avgDailyMinutes: avgDaily,
      recommendedMaxDailyMinutes: recommendedMaxDaily,
      daysSinceRest: daysSinceRest,
      recommendedRestFrequency: recommendedRestFrequency,
      needsRest: needsRest,
      status: status,
      analyzedAt: now,
    );
  }

  /// Generates scheduling suggestions based on analysis.
  List<SchedulingSuggestion> generateSuggestions({
    required String barnId,
    required List<HorseWorkloadAnalysis> horseAnalyses,
    required List<LessonModel> upcomingLessons,
    required List<TrainerAvailability> trainerAvailabilities,
  }) {
    final suggestions = <SchedulingSuggestion>[];
    final now = DateTime.now();

    // Check for overworked horses
    for (final analysis in horseAnalyses) {
      if (analysis.needsRest) {
        suggestions.add(SchedulingSuggestion(
          id: 'sug_${now.millisecondsSinceEpoch}_${analysis.horseId}',
          barnId: barnId,
          type: SuggestionType.horseRest,
          priority: analysis.status == WorkloadStatus.overworked
              ? SuggestionPriority.high
              : SuggestionPriority.medium,
          title: '${analysis.horseName} needs rest',
          description:
              '${analysis.horseName} has worked ${analysis.daysSinceRest} consecutive days. '
              'Consider scheduling a rest day.',
          horseId: analysis.horseId,
          horseName: analysis.horseName,
          reason: 'Horse has exceeded recommended work frequency of '
              '${analysis.recommendedRestFrequency} days without rest.',
          confidence: 0.9,
          createdAt: now,
          expiresAt: now.add(const Duration(days: 1)),
        ));
      }

      if (analysis.status == WorkloadStatus.overworked) {
        suggestions.add(SchedulingSuggestion(
          id: 'sug_${now.millisecondsSinceEpoch}_overwork_${analysis.horseId}',
          barnId: barnId,
          type: SuggestionType.horseRest,
          priority: SuggestionPriority.critical,
          title: '${analysis.horseName} is overworked',
          description:
              '${analysis.horseName} averages ${analysis.avgDailyMinutes.toStringAsFixed(0)} '
              'minutes/day, exceeding the recommended ${analysis.recommendedMaxDailyMinutes} minutes.',
          horseId: analysis.horseId,
          horseName: analysis.horseName,
          reason: 'Daily average exceeds recommended maximum by '
              '${((analysis.avgDailyMinutes / analysis.recommendedMaxDailyMinutes - 1) * 100).toStringAsFixed(0)}%.',
          confidence: 0.95,
          createdAt: now,
          expiresAt: now.add(const Duration(days: 1)),
        ));
      }
    }

    // Check for scheduling conflicts
    for (var i = 0; i < upcomingLessons.length; i++) {
      for (var j = i + 1; j < upcomingLessons.length; j++) {
        final lesson1 = upcomingLessons[i];
        final lesson2 = upcomingLessons[j];

        // Check if same horse is double-booked
        if (lesson1.horseId == lesson2.horseId &&
            lesson1.horseId != null &&
            _timesOverlap(
              lesson1.scheduledTime,
              lesson1.scheduledTime.add(Duration(minutes: lesson1.durationMinutes)),
              lesson2.scheduledTime,
              lesson2.scheduledTime.add(Duration(minutes: lesson2.durationMinutes)),
            )) {
          suggestions.add(SchedulingSuggestion(
            id: 'sug_${now.millisecondsSinceEpoch}_conflict_${lesson1.id}',
            barnId: barnId,
            type: SuggestionType.conflictResolution,
            priority: SuggestionPriority.high,
            title: 'Horse scheduling conflict',
            description:
                '${lesson1.horseName ?? "A horse"} is scheduled for overlapping lessons.',
            horseId: lesson1.horseId,
            horseName: lesson1.horseName,
            lessonId: lesson1.id,
            originalTime: lesson1.scheduledTime,
            reason: 'Two lessons are scheduled at overlapping times for the same horse.',
            confidence: 1.0,
            createdAt: now,
          ));
        }

        // Check if same trainer is double-booked
        if (lesson1.trainerId == lesson2.trainerId &&
            _timesOverlap(
              lesson1.scheduledTime,
              lesson1.scheduledTime.add(Duration(minutes: lesson1.durationMinutes)),
              lesson2.scheduledTime,
              lesson2.scheduledTime.add(Duration(minutes: lesson2.durationMinutes)),
            )) {
          suggestions.add(SchedulingSuggestion(
            id: 'sug_${now.millisecondsSinceEpoch}_trainer_${lesson1.id}',
            barnId: barnId,
            type: SuggestionType.conflictResolution,
            priority: SuggestionPriority.high,
            title: 'Trainer scheduling conflict',
            description:
                '${lesson1.trainerName ?? "A trainer"} has overlapping lessons.',
            trainerId: lesson1.trainerId,
            trainerName: lesson1.trainerName,
            lessonId: lesson1.id,
            originalTime: lesson1.scheduledTime,
            reason: 'Trainer is scheduled for two lessons at the same time.',
            confidence: 1.0,
            createdAt: now,
          ));
        }
      }
    }

    return suggestions;
  }

  /// Finds optimal time slots for a new lesson.
  List<TrainerScheduleSlot> findOptimalSlots({
    required String trainerId,
    required String trainerName,
    required DateTime preferredDate,
    required int durationMinutes,
    required List<LessonModel> existingLessons,
    TrainerAvailability? availability,
    HorseWorkloadAnalysis? horseAnalysis,
  }) {
    final slots = <TrainerScheduleSlot>[];
    final startHour = availability?.startHour ?? 8;
    final endHour = availability?.endHour ?? 18;

    // Generate potential slots
    for (var hour = startHour; hour < endHour; hour++) {
      for (final minute in [0, 30]) {
        final slotStart = DateTime(
          preferredDate.year,
          preferredDate.month,
          preferredDate.day,
          hour,
          minute,
        );
        final slotEnd = slotStart.add(Duration(minutes: durationMinutes));

        // Check if slot is available
        var isAvailable = true;
        String? bookedLessonId;
        String? bookedClientName;
        String? bookedHorseName;

        for (final lesson in existingLessons) {
          final lessonEnd = lesson.scheduledTime
              .add(Duration(minutes: lesson.durationMinutes));
          if (_timesOverlap(slotStart, slotEnd, lesson.scheduledTime, lessonEnd)) {
            isAvailable = false;
            bookedLessonId = lesson.id;
            bookedClientName = lesson.clientName;
            bookedHorseName = lesson.horseName;
            break;
          }
        }

        // Calculate suitability score
        var score = isAvailable ? 1.0 : 0.0;
        final factors = <String>[];

        if (isAvailable) {
          // Prefer mid-morning/early afternoon
          if (hour >= 9 && hour <= 11) {
            score += 0.2;
            factors.add('Optimal morning time');
          } else if (hour >= 14 && hour <= 16) {
            score += 0.15;
            factors.add('Good afternoon time');
          }

          // Penalize if horse is tired
          if (horseAnalysis != null && horseAnalysis.needsRest) {
            score -= 0.3;
            factors.add('Horse needs rest');
          }

          // Normalize score
          score = score.clamp(0.0, 1.0);
        }

        slots.add(TrainerScheduleSlot(
          trainerId: trainerId,
          trainerName: trainerName,
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: isAvailable,
          bookedLessonId: bookedLessonId,
          bookedClientName: bookedClientName,
          bookedHorseName: bookedHorseName,
          suitabilityScore: score,
          scoreFactors: factors,
        ));
      }
    }

    // Sort by suitability score
    slots.sort((a, b) => b.suitabilityScore.compareTo(a.suitabilityScore));

    return slots;
  }

  bool _timesOverlap(
    DateTime start1,
    DateTime end1,
    DateTime start2,
    DateTime end2,
  ) {
    return start1.isBefore(end2) && end1.isAfter(start2);
  }
}
