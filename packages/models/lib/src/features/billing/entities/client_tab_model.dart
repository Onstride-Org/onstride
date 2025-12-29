import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'client_tab_model.freezed.dart';
part 'client_tab_model.g.dart';

/// A client's running tab/balance overview.
@freezed
sealed class ClientTabModel with _$ClientTabModel {
  const factory ClientTabModel({
    required String id,
    required String barnId,
    required String clientId,
    required String clientName,
    @TimestampConverter() required DateTime updatedAt,
    /// Current open charges not yet billed
    @Default(0.0) double pendingCharges,
    /// Total outstanding balance (all unpaid invoices + pending)
    @Default(0.0) double totalBalance,
    /// Amount paid this billing cycle
    @Default(0.0) double paidThisCycle,
    /// Current billing period ID
    String? currentPeriodId,
    /// Last payment date
    @NullableTimestampConverter() DateTime? lastPaymentDate,
    /// Last payment amount
    double? lastPaymentAmount,
    /// Number of outstanding invoices
    @Default(0) int outstandingInvoiceCount,
    /// Total overdue amount
    @Default(0.0) double overdueAmount,
    /// Credit balance (if they've overpaid)
    @Default(0.0) double creditBalance,
  }) = _ClientTabModel;

  factory ClientTabModel.fromJson(Map<String, dynamic> json) =>
      _$ClientTabModelFromJson(json);
}

extension ClientTabModelX on ClientTabModel {
  /// Net amount owed (balance minus credits).
  double get netBalance => totalBalance - creditBalance;

  /// Whether client has any outstanding balance.
  bool get hasBalance => netBalance > 0;

  /// Whether client has overdue payments.
  bool get hasOverdue => overdueAmount > 0;

  /// Account status description.
  String get accountStatus {
    if (hasOverdue) return 'Overdue';
    if (hasBalance) return 'Balance Due';
    if (creditBalance > 0) return 'Credit Balance';
    return 'Current';
  }
}
