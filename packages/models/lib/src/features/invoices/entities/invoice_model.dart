// lib/features/invoices/models/invoice_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'invoice_model.freezed.dart';
part 'invoice_model.g.dart';

/// Invoice status lifecycle.
enum InvoiceStatus { pending, processing, paid, failed }

extension InvoiceStatusExt on InvoiceStatus {
  bool get isFailed => this == InvoiceStatus.failed;

  bool get isProcessing => this == InvoiceStatus.processing;

  bool get isPaid => this == InvoiceStatus.paid;

  bool get isPending => this == InvoiceStatus.pending;
}

@freezed
sealed class InvoiceModel with _$InvoiceModel {
  const factory InvoiceModel({
    required String id,
    required String barnId,
    required String boarderId,
    required String horseId,
    required String createdById,
    @TimestampConverter() required DateTime dueDate,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime updatedAt,
    @Default(<InvoiceCharge>[]) List<InvoiceCharge> charges,
    @Default(StripeFees.fallback) StripeFees allFees,
    @Default(InvoiceStatus.pending) InvoiceStatus status,
    @Default('') String horseName,
    @Default('') String boarderName,
    GLPaymentMethod? method,
    PaymentBreakdown? paymentBreakdown,
    @JsonKey(name: 'stripe') StripePaymentInfo? stripePaymentInfo,
    String? failureReason,
    @NullableTimestampConverter() DateTime? deletedAt,
    String? paymentIntentId,
    String? deletedBy,
    String? deletionReason,
  }) = _InvoiceModel;

  factory InvoiceModel.fromJson(Map<String, dynamic> json) =>
      _$InvoiceModelFromJson(json);
}

/// Single invoice line/charge.
@freezed
sealed class InvoiceCharge with _$InvoiceCharge {
  const factory InvoiceCharge({
    required String description,
    @Default(0.0) double amount,
    @Default(1) int quantity,
  }) = _InvoiceCharge;

  factory InvoiceCharge.fromJson(Map<String, dynamic> json) =>
      _$InvoiceChargeFromJson(json);
}

/// Helpers: compute totals.
extension InvoiceTotalsX on InvoiceModel {
  double get _subtotal =>
      charges.fold(0, (sum, c) => sum + (c.amount * c.quantity));

  int get subtotalCents => (_subtotal * 100).round();

  double get subtotalUsd => _subtotal;

  bool get canPay => status.isPending || status.isFailed;
}

/// Helpers: compute Stripe or payment-related fees.
extension InvoiceFeesX on InvoiceModel {
  double get paymentFee {
    final breakdownFee = paymentBreakdown?.stripeFee;
    if (breakdownFee != null && breakdownFee > 0) return breakdownFee;
    final methodType =
        stripePaymentInfo?.paymentMethodType?.toLowerCase() ?? method?.name;
    final sub = _subtotal;
    if (sub <= 0) return 0.0;
    if (methodType == 'card') {
      return (sub * 0.029) + 0.30;
    } else if (methodType == 'us_bank_account' || methodType == 'ach') {
      return sub * 0.008;
    }
    return (sub * 0.029) + 0.30;
  }

  double get platformFee => _subtotal * allFees.platformFeePercent;
}
