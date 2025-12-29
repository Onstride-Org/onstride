import 'package:freezed_annotation/freezed_annotation.dart';

part 'stripe_fees.freezed.dart';
part 'stripe_fees.g.dart';

@freezed
sealed class StripeFees with _$StripeFees {
  const factory StripeFees({
    required double stripeFeeCardPercent,
    required double stripeFeeAchPercent,
    required double platformFeePercent,
    required int stripeFeeCardFixedCents,
    required int stripeFeeAchCapCents,
  }) = _StripeFees;

  factory StripeFees.fromJson(Map<String, dynamic> json) =>
      _$StripeFeesFromJson(json);

  static const StripeFees fallback = StripeFees(
    stripeFeeCardPercent: 0.029,
    stripeFeeAchPercent: 0.008,
    platformFeePercent: 0.005,
    stripeFeeCardFixedCents: 30,
    stripeFeeAchCapCents: 500,
  );
}
