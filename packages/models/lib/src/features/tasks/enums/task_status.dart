import 'package:flutter/material.dart';

enum TaskStatus { notStarted, completed, overdue }

extension TaskStatusExt on TaskStatus {
  Color? get statusColor {
    if (this == TaskStatus.notStarted) {
      return Colors.orange.shade100;
    }

    if (this == TaskStatus.completed) {
      return Colors.green.shade100;
    }

    if (this == TaskStatus.overdue) {
      return Colors.red.shade100;
    }

    return null;
  }

  Color? get statusFontColor {
    if (this == TaskStatus.notStarted) {
      return Colors.orange.shade900;
    }

    if (this == TaskStatus.completed) {
      return Colors.green.shade800;
    }

    if (this == TaskStatus.overdue) {
      return Colors.red.shade800;
    }

    return null;
  }
}
