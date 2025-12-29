import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'billing_template_model.freezed.dart';
part 'billing_template_model.g.dart';

/// A line item in a billing template.
@freezed
sealed class TemplateLineItem with _$TemplateLineItem {
  const factory TemplateLineItem({
    required String id,
    required String description,
    required ChargeType type,
    required double amount,
    @Default(1) int defaultQuantity,
    /// Whether this line item is taxable
    @Default(false) bool isTaxable,
    /// Order for display
    @Default(0) int sortOrder,
    String? notes,
  }) = _TemplateLineItem;

  factory TemplateLineItem.fromJson(Map<String, dynamic> json) =>
      _$TemplateLineItemFromJson(json);
}

extension TemplateLineItemX on TemplateLineItem {
  double get defaultTotal => amount * defaultQuantity;
}

/// A reusable billing template.
@freezed
sealed class BillingTemplateModel with _$BillingTemplateModel {
  const factory BillingTemplateModel({
    required String id,
    required String barnId,
    required String name,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime updatedAt,
    String? description,
    /// Line items in this template
    @Default(<TemplateLineItem>[]) List<TemplateLineItem> lineItems,
    /// Default tax rate (as decimal, e.g., 0.08 for 8%)
    @Default(0.0) double taxRate,
    /// Whether to apply tax to taxable items
    @Default(false) bool applyTax,
    /// Discount settings
    @Default(0.0) double discountPercent,
    @Default(0.0) double discountAmount,
    /// Season/category this template is for
    String? season,
    String? category,
    /// Whether this is the default template for new clients
    @Default(false) bool isDefault,
    /// Created by
    String? createdById,
    @NullableTimestampConverter() DateTime? deletedAt,
    String? deletedBy,
  }) = _BillingTemplateModel;

  factory BillingTemplateModel.fromJson(Map<String, dynamic> json) =>
      _$BillingTemplateModelFromJson(json);
}

extension BillingTemplateModelX on BillingTemplateModel {
  /// Calculate subtotal of all line items.
  double get subtotal {
    return lineItems.fold(0.0, (sum, item) => sum + item.defaultTotal);
  }

  /// Calculate tax amount.
  double get taxAmount {
    if (!applyTax || taxRate <= 0) return 0.0;
    final taxable = lineItems
        .where((item) => item.isTaxable)
        .fold(0.0, (sum, item) => sum + item.defaultTotal);
    return taxable * taxRate;
  }

  /// Calculate discount amount.
  double get calculatedDiscount {
    if (discountAmount > 0) return discountAmount;
    if (discountPercent > 0) return subtotal * discountPercent;
    return 0.0;
  }

  /// Calculate total after tax and discount.
  double get total {
    return subtotal + taxAmount - calculatedDiscount;
  }

  /// Number of line items.
  int get itemCount => lineItems.length;
}
