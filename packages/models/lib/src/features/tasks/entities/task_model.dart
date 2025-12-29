import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';
import 'package:models/src/core/converters/date_time_converter.dart';

part 'task_model.freezed.dart';
part 'task_model.g.dart';

@freezed
sealed class TaskModel with _$TaskModel {
  const factory TaskModel({
    required String id,
    required String name,
    required bool sendReminder,
    required DateTime createdAt,
    required DateTime updatedAt,
    required TaskStatus status,
    String? groomId,
    @DateTimeConverter() required DateTime dueDate,
    @Default(<HorseSummary>[]) List<HorseSummary> horses,
    @Default(<GLUserSummary>[]) List<GLUserSummary> assignees,
    @Default(false) bool notificationSent,
    String? barnId,
    @NullableTimestampConverter() DateTime? deletedAt,
    String? deletedBy,
    String? deletionReason,
  }) = _TaskModel;

  factory TaskModel.fromJson(Map<String, dynamic> json) =>
      _TaskModelJsonCompat.fromJson(json);
}

final class _TaskModelJsonCompat {
  static TaskModel fromJson(Map<String, dynamic> json) {
    final normalized = Map<String, dynamic>.from(json);

    final hasNewHorses = normalized['horses'] is List;
    if (!hasNewHorses) {
      final horseId = normalized['horse_id'] as String?;
      final horseName = normalized['horse_name'] as String?;
      final legacyBoarderId = normalized['boarder_id'] as String?;

      normalized['horses'] = horseId == null
          ? <Map<String, dynamic>>[]
          : <Map<String, dynamic>>[
              {
                'id': horseId,
                'name': horseName ?? '',
                'boarder_id': legacyBoarderId,
              },
            ];
    }

    final hasNewAssignees = normalized['assignees'] is List;
    if (!hasNewAssignees) {
      final groomId = normalized['groom_id'] as String?;
      final groomName = normalized['groom_name'] as String?;

      normalized['assignees'] = groomId == null
          ? <Map<String, dynamic>>[]
          : <Map<String, dynamic>>[
              {
                'id': groomId,
                'name': groomName ?? '',
                'account_type': AccountType.groomer.name,
              },
            ];
    }

    return _$TaskModelFromJson(normalized);
  }
}

extension TaskModelX on TaskModel {
  /// Returns all assignee ids for this task.
  List<String> get assigneeIds => assignees.map((a) => a.id).toList();

  /// Returns all horse ids for this task.
  List<String> get horseIds => horses.map((h) => h.id).toList();

  /// Returns all assignee names for this task.
  ///
  /// If an assignee name is missing, it is skipped.
  List<String> get assigneeNames => assignees
      .map((a) => a.name)
      .whereType<String>()
      .map((n) => n.trim())
      .where((n) => n.isNotEmpty)
      .toList();

  /// Returns all horse names for this task.
  List<String> get horseNames =>
      horses.map((h) => h.name.trim()).where((n) => n.isNotEmpty).toList();
}
