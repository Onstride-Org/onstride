// notification_data.dart
// ignore_for_file: invalid_annotation_target

import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';

part 'notification_data.freezed.dart';
part 'notification_data.g.dart';

/// Strongly-typed notification payload used across FCM and local notifications.
/// Variants are sealed to ensure exhaustive handling in navigation logic.
@freezed
sealed class NotificationData with _$NotificationData {
  /// Task reminder / detail deep link
  const factory NotificationData.task({
    required String taskId,
    DateTime? dueDate,
  }) = _Task;

  /// Invoice detail deep link
  const factory NotificationData.invoice({
    required String invoiceId,
    required String barnId,
  }) = _Invoice;

  const NotificationData._();

  /// Parse from a raw map (e.g., RemoteMessage.data or decoded local payload).
  /// Heuristics:
  /// - Prefer `type` key if present: 'task' | 'invoice'
  /// - Fallback to presence of specific keys: taskId / invoice_id | invoiceId
  static NotificationData? fromMap(Map<String, dynamic>? map) {
    if (map == null) return null;

    // Normalize keys to strings
    final data = map.map((k, v) => MapEntry(k.toString(), v));

    final type = (data['type'] ?? data['notification_type'] ?? '')
        .toString()
        .trim()
        .toLowerCase();

    if (type == 'task') {
      final taskId = (data['taskId'] ?? data['task_id'])?.toString();
      if (taskId != null && taskId.isNotEmpty) {
        final dueDateStr = (data['dueDate'] ?? data['due_date'])?.toString();
        DateTime? due;
        if (dueDateStr != null && dueDateStr.isNotEmpty) {
          try {
            due = DateTime.parse(dueDateStr);
          } catch (_) {}
        }
        return NotificationData.task(taskId: taskId, dueDate: due);
      }
    }

    if (type == 'invoice') {
      final invId = (data['invoice_id'] ?? data['invoiceId'])?.toString();
      final barnId = (data['barn_id'] ?? data['invoiceId'])?.toString();
      if (invId != null && invId.isNotEmpty) {
        return NotificationData.invoice(invoiceId: invId, barnId: barnId ?? '');
      }
    }

    // Fallback: infer from keys if type is missing
    final taskId = (data['taskId'] ?? data['task_id'])?.toString();
    if (taskId != null && taskId.isNotEmpty) {
      final dueDateStr = (data['dueDate'] ?? data['due_date'])?.toString();
      DateTime? due;
      if (dueDateStr != null && dueDateStr.isNotEmpty) {
        try {
          due = DateTime.parse(dueDateStr);
        } catch (_) {}
      }
      return NotificationData.task(taskId: taskId, dueDate: due);
    }

    final invId = (data['invoice_id'] ?? data['invoiceId'])?.toString();
    final barnId = (data['barn_id'] ?? data['barnId'])?.toString();
    if (invId != null && invId.isNotEmpty) {
      return NotificationData.invoice(invoiceId: invId, barnId: barnId ?? '');
    }

    return null;
  }

  /// Parse from a JSON string payload (local notifications).
  static NotificationData? fromPayloadJson(String? jsonString) {
    if (jsonString == null || jsonString.isEmpty) return null;
    try {
      final raw = jsonDecode(jsonString);
      if (raw is Map<String, dynamic>) {
        return NotificationData.fromMap(raw);
      }
      // Sometimes SDKs deliver payload as Map<String, String>
      if (raw is Map) {
        return NotificationData.fromMap(
          raw.map((k, v) => MapEntry(k.toString(), v)),
        );
      }
    } catch (_) {
      // ignore parsing errors
    }
    return null;
  }

  /// Serialize to a plain map (useful for local notifications payload).
  Map<String, dynamic> toPayloadMap() => when(
    task: (taskId, dueDate) => {
      'type': 'task',
      'taskId': taskId,
      if (dueDate != null) 'dueDate': dueDate.toIso8601String(),
    },
    invoice: (invoiceId, barnId) => {
      'type': 'invoice',
      'invoice_id': invoiceId,
      'barn_id': barnId,
    },
  );

  /// JSON string suited for local notification payloads.
  String toPayloadJson() => jsonEncode(toPayloadMap());

  factory NotificationData.fromJson(Map<String, dynamic> json) =>
      _$NotificationDataFromJson(json);
}
