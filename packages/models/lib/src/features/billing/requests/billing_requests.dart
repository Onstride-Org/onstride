import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'billing_requests.freezed.dart';
part 'billing_requests.g.dart';

/// Request payload for creating a new charge.
@freezed
sealed class CreateChargePayload with _$CreateChargePayload {
  const factory CreateChargePayload({
    required String barnId,
    required String clientId,
    required ChargeType type,
    required String description,
    required double amount,
    @TimestampConverter() required DateTime chargeDate,
    @Default(1) int quantity,
    String? horseId,
    String? horseName,
    String? billingPeriodId,
    String? lessonId,
    @Default(false) bool isOneOff,
    String? createdById,
    String? createdByName,
    String? notes,
  }) = _CreateChargePayload;

  factory CreateChargePayload.fromJson(Map<String, dynamic> json) =>
      _$CreateChargePayloadFromJson(json);
}

/// Request payload for creating a billing period.
@freezed
sealed class CreateBillingPeriodPayload with _$CreateBillingPeriodPayload {
  const factory CreateBillingPeriodPayload({
    required String barnId,
    required String clientId,
    @TimestampConverter() required DateTime startDate,
    @TimestampConverter() required DateTime endDate,
    @TimestampConverter() required DateTime dueDate,
    String? clientName,
    @Default(0.0) double previousBalance,
    String? notes,
  }) = _CreateBillingPeriodPayload;

  factory CreateBillingPeriodPayload.fromJson(Map<String, dynamic> json) =>
      _$CreateBillingPeriodPayloadFromJson(json);
}

/// Request payload for creating a billing template.
@freezed
sealed class CreateBillingTemplatePayload with _$CreateBillingTemplatePayload {
  const factory CreateBillingTemplatePayload({
    required String barnId,
    required String name,
    String? description,
    @Default(<TemplateLineItem>[]) List<TemplateLineItem> lineItems,
    @Default(0.0) double taxRate,
    @Default(false) bool applyTax,
    @Default(0.0) double discountPercent,
    @Default(0.0) double discountAmount,
    String? season,
    String? category,
    @Default(false) bool isDefault,
    String? createdById,
  }) = _CreateBillingTemplatePayload;

  factory CreateBillingTemplatePayload.fromJson(Map<String, dynamic> json) =>
      _$CreateBillingTemplatePayloadFromJson(json);
}

/// Request payload for applying a template to a client.
@freezed
sealed class ApplyTemplatePayload with _$ApplyTemplatePayload {
  const factory ApplyTemplatePayload({
    required String templateId,
    required String clientId,
    required String billingPeriodId,
    /// Override quantities for specific line items (itemId -> quantity)
    @Default(<String, int>{}) Map<String, int> quantityOverrides,
    /// Exclude specific line item IDs
    @Default(<String>[]) List<String> excludeItemIds,
  }) = _ApplyTemplatePayload;

  factory ApplyTemplatePayload.fromJson(Map<String, dynamic> json) =>
      _$ApplyTemplatePayloadFromJson(json);
}
