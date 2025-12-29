import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'charge_model.freezed.dart';
part 'charge_model.g.dart';

/// A single charge/line item in a client's bill.
@freezed
sealed class ChargeModel with _$ChargeModel {
  const factory ChargeModel({
    required String id,
    required String barnId,
    required String clientId,
    required ChargeType type,
    required String description,
    required double amount,
    required ChargeStatus status,
    @TimestampConverter() required DateTime chargeDate,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime updatedAt,
    @Default(1) int quantity,
    /// Reference to horse if applicable
    String? horseId,
    String? horseName,
    /// Reference to billing period if part of monthly billing
    String? billingPeriodId,
    /// Reference to invoice if already invoiced
    String? invoiceId,
    /// For lesson charges, link to the lesson
    String? lessonId,
    /// One-off charges are billed immediately, not on cycle
    @Default(false) bool isOneOff,
    /// Who created this charge
    String? createdById,
    String? createdByName,
    String? notes,
    @NullableTimestampConverter() DateTime? deletedAt,
    String? deletedBy,
  }) = _ChargeModel;

  factory ChargeModel.fromJson(Map<String, dynamic> json) =>
      _$ChargeModelFromJson(json);
}

extension ChargeModelX on ChargeModel {
  double get total => amount * quantity;

  bool get isBilled => status == ChargeStatus.billed || status == ChargeStatus.paid;

  bool get canEdit => status == ChargeStatus.pending;

  bool get canDelete => status == ChargeStatus.pending;
}
