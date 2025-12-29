import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'billing_period_model.freezed.dart';
part 'billing_period_model.g.dart';

/// A billing period for a client (typically monthly).
@freezed
sealed class BillingPeriodModel with _$BillingPeriodModel {
  const factory BillingPeriodModel({
    required String id,
    required String barnId,
    required String clientId,
    @TimestampConverter() required DateTime startDate,
    @TimestampConverter() required DateTime endDate,
    @TimestampConverter() required DateTime dueDate,
    required BillingPeriodStatus status,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime updatedAt,
    String? clientName,
    /// Running total of charges in this period
    @Default(0.0) double totalCharges,
    /// Amount already paid
    @Default(0.0) double amountPaid,
    /// Previous balance carried forward
    @Default(0.0) double previousBalance,
    /// Generated invoice ID
    String? invoiceId,
    @NullableTimestampConverter() DateTime? invoicedAt,
    @NullableTimestampConverter() DateTime? paidAt,
    String? notes,
    @NullableTimestampConverter() DateTime? deletedAt,
    String? deletedBy,
  }) = _BillingPeriodModel;

  factory BillingPeriodModel.fromJson(Map<String, dynamic> json) =>
      _$BillingPeriodModelFromJson(json);
}

extension BillingPeriodModelX on BillingPeriodModel {
  /// Total amount due including previous balance.
  double get totalDue => totalCharges + previousBalance - amountPaid;

  /// Remaining balance to pay.
  double get balanceRemaining => totalDue;

  /// Whether this period is fully paid.
  bool get isFullyPaid => amountPaid >= (totalCharges + previousBalance);

  /// Whether this period can accept new charges.
  bool get canAddCharges => status.canAddCharges;

  /// Display string for the billing period.
  String get periodLabel {
    final startMonth = _monthName(startDate.month);
    final endMonth = _monthName(endDate.month);
    if (startDate.year == endDate.year && startDate.month == endDate.month) {
      return '$startMonth ${startDate.year}';
    }
    return '$startMonth - $endMonth ${endDate.year}';
  }

  static String _monthName(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }
}
