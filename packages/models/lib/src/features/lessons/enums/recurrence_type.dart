/// Recurrence pattern for standing lessons.
enum RecurrenceType {
  none,
  daily,
  weekly,
  biweekly,
  monthly,
  custom,
}

extension RecurrenceTypeX on RecurrenceType {
  String get displayName {
    switch (this) {
      case RecurrenceType.none:
        return 'One-time';
      case RecurrenceType.daily:
        return 'Daily';
      case RecurrenceType.weekly:
        return 'Weekly';
      case RecurrenceType.biweekly:
        return 'Bi-weekly';
      case RecurrenceType.monthly:
        return 'Monthly';
      case RecurrenceType.custom:
        return 'Custom';
    }
  }

  bool get isRecurring => this != RecurrenceType.none;
}
