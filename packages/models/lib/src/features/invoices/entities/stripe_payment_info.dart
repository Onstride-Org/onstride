import 'package:freezed_annotation/freezed_annotation.dart';

part 'stripe_payment_info.freezed.dart';
part 'stripe_payment_info.g.dart';

/// Represents Stripe-related data stored in Firestore invoices.
@freezed
sealed class StripePaymentInfo with _$StripePaymentInfo {
  const factory StripePaymentInfo({
    /// Stripe PaymentIntent ID associated with the invoice
    String? paymentIntentId,

    /// Stripe Charge ID of the most recent charge
    String? latestChargeId,

    /// Stripe connected account ID (if applicable)
    String? connectedAccountId,

    /// Receipt URL from the charge
    String? receiptUrl,

    /// Indicates the payment method used (e.g. 'card', 'us_bank_account')
    String? paymentMethodType,

    /// Card brand (e.g. 'visa', 'mastercard', 'amex')
    String? cardBrand,

    /// Last 4 digits of the card number
    String? cardLast4,

    /// Last 4 digits of the bank account used (for ACH)
    String? bankLast4,

    /// Last payment error message (if any)
    String? lastError,
  }) = _StripePaymentInfo;

  factory StripePaymentInfo.fromJson(Map<String, dynamic> json) =>
      _$StripePaymentInfoFromJson(json);
}
