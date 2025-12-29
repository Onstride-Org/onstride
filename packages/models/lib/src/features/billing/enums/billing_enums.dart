/// Status of a billing period.
enum BillingPeriodStatus {
  /// Currently active, accepting new charges
  open,
  /// Closed, invoice generated
  closed,
  /// Invoice sent to client
  invoiced,
  /// Fully paid
  paid,
  /// Partially paid
  partiallyPaid,
  /// Past due
  overdue,
}

extension BillingPeriodStatusX on BillingPeriodStatus {
  String get displayName {
    switch (this) {
      case BillingPeriodStatus.open:
        return 'Open';
      case BillingPeriodStatus.closed:
        return 'Closed';
      case BillingPeriodStatus.invoiced:
        return 'Invoiced';
      case BillingPeriodStatus.paid:
        return 'Paid';
      case BillingPeriodStatus.partiallyPaid:
        return 'Partially Paid';
      case BillingPeriodStatus.overdue:
        return 'Overdue';
    }
  }

  bool get canAddCharges => this == BillingPeriodStatus.open;

  bool get isPaid => this == BillingPeriodStatus.paid;
}

/// Type of charge for billing.
enum ChargeType {
  board,
  lesson,
  training,
  farrier,
  vet,
  feed,
  supplies,
  service,
  other,
}

extension ChargeTypeX on ChargeType {
  String get displayName {
    switch (this) {
      case ChargeType.board:
        return 'Board';
      case ChargeType.lesson:
        return 'Lesson';
      case ChargeType.training:
        return 'Training';
      case ChargeType.farrier:
        return 'Farrier';
      case ChargeType.vet:
        return 'Veterinary';
      case ChargeType.feed:
        return 'Feed';
      case ChargeType.supplies:
        return 'Supplies';
      case ChargeType.service:
        return 'Service';
      case ChargeType.other:
        return 'Other';
    }
  }
}

/// Status of a single charge.
enum ChargeStatus {
  pending,
  billed,
  paid,
  cancelled,
  refunded,
}

extension ChargeStatusX on ChargeStatus {
  String get displayName {
    switch (this) {
      case ChargeStatus.pending:
        return 'Pending';
      case ChargeStatus.billed:
        return 'Billed';
      case ChargeStatus.paid:
        return 'Paid';
      case ChargeStatus.cancelled:
        return 'Cancelled';
      case ChargeStatus.refunded:
        return 'Refunded';
    }
  }

  bool get isFinal =>
      this == ChargeStatus.paid ||
      this == ChargeStatus.cancelled ||
      this == ChargeStatus.refunded;
}
