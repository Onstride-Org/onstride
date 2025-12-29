// coverage:ignore-file
// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';

part 'payment_breakdown.freezed.dart';
part 'payment_breakdown.g.dart';

/// Represents the breakdown of a payment calculation.
/// It shows how the total amount charged (gross) is distributed
/// among Stripe fees, platform fees, and the owner net amount.
/// All values are expressed in integer cents for precision.
///
/// Percent fields:
/// - "*Applied"   -> percentage over the total charged (T).
/// - "*OverTarget"-> percentage over the original invoice target (N).
@freezed
sealed class PaymentBreakdown with _$PaymentBreakdown {
  /// Use sealed for stricter unions by default (Freezed generates a sealed class).
  const factory PaymentBreakdown({
    /// Original invoice target net (N). Owner must receive exactly this.
    required int targetNetCents,

    /// Total charged to the payer (T).
    required int totalCents,

    /// Stripe fee (includes tax if applicable).
    required int stripeFeeCents,

    /// Platform fee (calculated over N).
    required int platformFeeCents,

    /// Net amount received by the owner (should equal targetNetCents).
    required int ownerNetCents,

    /// Convenience: totalCents - targetNetCents.
    required int serviceFeeCents,

    /// Effective percentages over the total charged (legacy reference).
    /// Example: 0.029 = 2.9%
    required double stripePercentApplied, // stripeFee / T
    required double platformPercentApplied, // platformFee / T
    /// Percentages over the initial invoice amount (N).
    required double stripePercentOverTarget, // stripeFee / N
    required double platformPercentOverTarget, // platformFee / N
    required double serviceFeePercentOverTarget, // (T - N) / N
  }) = _PaymentBreakdown;

  const PaymentBreakdown._(); // For extensions/getters

  factory PaymentBreakdown.fromJson(Map<String, dynamic> json) =>
      _$PaymentBreakdownFromJson(json);
}

/// Presentation helpers for UI formatting.
/// These keep the domain model clean and provide
/// human-friendly strings for money and percentages.
extension PaymentBreakdownPresent on PaymentBreakdown {
  // ---------- Money as doubles (dollars) ----------
  double get total => totalCents / 100.0;

  double get stripeFee => stripeFeeCents / 100.0;

  double get platformFee => platformFeeCents / 100.0;

  double get ownerNet => ownerNetCents / 100.0;

  double get serviceFee => serviceFeeCents / 100.0;

  double get targetNet => targetNetCents / 100.0;

  // ---------- Money formatted ----------
  /// Formats a monetary value with two decimals. Keep it simple
  /// to avoid external deps; you can swap to `intl` later if needed.
  String _money(num amount, {String symbol = r'$'}) =>
      '$symbol${amount.toStringAsFixed(2)}';

  String get totalText => _money(total);

  String get stripeFeeText => _money(stripeFee);

  String get platformFeeText => _money(platformFee);

  String get ownerNetText => _money(ownerNet);

  String get serviceFeeText => _money(serviceFee);

  String get targetNetText => _money(targetNet);

  // ---------- Percent formatted ----------
  /// Formats a decimal percent (0.0582 -> "5.82%")
  String _pct(double value) => '${(value * 100).toStringAsFixed(3)}%';

  // Over total charged (T)
  String get stripePctAppliedText => _pct(stripePercentApplied);

  String get platformPctAppliedText => _pct(platformPercentApplied);

  // Over target (N)
  String get stripePctOverTargetText => _pct(stripePercentOverTarget);

  String get platformPctOverTargetText => _pct(platformPercentOverTarget);

  String get servicePctOverTargetText => _pct(serviceFeePercentOverTarget);

  // ---------- Composite strings for quick UI ----------
  String get stripeLineOverN =>
      'Stripe fee: $stripeFeeText  ($stripePctOverTargetText of N)';

  String get platformLineOverN =>
      'Platform fee: $platformFeeText  ($platformPctOverTargetText of N)';

  String get serviceLineOverN =>
      'Service fee total: $serviceFeeText  ($servicePctOverTargetText of N)';

  /// Pretty multi-line breakdown, useful for logs/debug.
  String pretty() =>
      '''
======== PaymentBreakdown ========
Total charged (T):      $totalText
  - Stripe fee:         $stripeFeeText  ($stripePctOverTargetText of N)
  - Platform fee:       $platformFeeText  ($platformPctOverTargetText of N)
  ---------------------------------
Net to owner (N):       $ownerNetText
Service fee total:      $serviceFeeText  ($servicePctOverTargetText of N)
==============================
''';
}
