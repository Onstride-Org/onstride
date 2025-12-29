/// Status of a lesson in the scheduling workflow.
enum LessonStatus {
  /// Initial request submitted, awaiting response
  requested,

  /// Lesson has been approved/confirmed
  approved,

  /// Lesson was rejected by the trainer
  rejected,

  /// A counter-proposal has been made
  countered,

  /// Lesson was cancelled by either party
  cancelled,

  /// Lesson has been completed
  completed,
}

extension LessonStatusX on LessonStatus {
  String get displayName {
    switch (this) {
      case LessonStatus.requested:
        return 'Requested';
      case LessonStatus.approved:
        return 'Approved';
      case LessonStatus.rejected:
        return 'Rejected';
      case LessonStatus.countered:
        return 'Counter Proposed';
      case LessonStatus.cancelled:
        return 'Cancelled';
      case LessonStatus.completed:
        return 'Completed';
    }
  }

  bool get isPending =>
      this == LessonStatus.requested || this == LessonStatus.countered;

  bool get isActive => this == LessonStatus.approved;

  bool get isFinal =>
      this == LessonStatus.rejected ||
      this == LessonStatus.cancelled ||
      this == LessonStatus.completed;
}
