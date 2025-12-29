import 'package:models/models.dart';

PaymentBreakdown computePaymentBreakdown({
  required int targetNetCents, // N (owner net desired)
  required double stripePercent, // e.g., 0.029 or 0.008
  required int stripeFixedCents, // e.g., 30
  required double platformPercent, // applied over N (not T)
  required int platformFixedCents, // applied over N
  double stripeTaxPercent = 0.0, // e.g., 0.16 for VAT
  int? stripePercentCapCents, // e.g., 500 for $5 cap
}) {
  // Replace ceilInt by roundCents where we want banker's rounding to nearest cent
  int roundCents(num v) => v.round();

  // --- Platform fee over N: use rounding instead of ceil ---
  final platformFeeCentsOnTarget = roundCents(
    platformPercent * targetNetCents + platformFixedCents,
  );

  int _stripeFeeForTotal(int tCents) {
    final rawPct = stripePercent * tCents; // in cents
    final pctComponent = (stripePercentCapCents == null)
        ? rawPct
        : (rawPct > stripePercentCapCents
              ? stripePercentCapCents.toDouble()
              : rawPct);

    final base = pctComponent + stripeFixedCents; // cents
    final withTax = base * (1.0 + stripeTaxPercent); // cents
    return roundCents(withTax); // <-- round, not ceil
  }

  PaymentBreakdown _buildResult(int tCents) {
    final stripeFee = _stripeFeeForTotal(tCents);
    final ownerNet = tCents - stripeFee - platformFeeCentsOnTarget;
    final serviceFee = tCents - targetNetCents;

    final stripePctApplied = tCents > 0 ? (stripeFee / tCents) : 0.0;
    final platformPctApplied = tCents > 0
        ? (platformFeeCentsOnTarget / tCents)
        : 0.0;

    final n = targetNetCents > 0 ? targetNetCents.toDouble() : 1.0;
    final stripeOverN = stripeFee / n;
    final platformOverN = platformFeeCentsOnTarget / n;
    final serviceOverN = serviceFee / n;

    return PaymentBreakdown(
      targetNetCents: targetNetCents,
      totalCents: tCents,
      stripeFeeCents: stripeFee,
      platformFeeCents: platformFeeCentsOnTarget,
      serviceFeeCents: serviceFee,
      ownerNetCents: ownerNet,
      stripePercentApplied: stripePctApplied,
      platformPercentApplied: platformPctApplied,
      stripePercentOverTarget: stripeOverN,
      platformPercentOverTarget: platformOverN,
      serviceFeePercentOverTarget: serviceOverN,
    );
  }

  // ---------- Closed-form (uncapped) ----------
  // T - (ps*T + fs)*(1+vat) - P = N
  // T * (1 - ps*(1+vat)) = N + P + fs*(1+vat)
  // T = [N + P + fs*(1+vat)] / [1 - ps*(1+vat)]
  final denomUncapped = 1.0 - (stripePercent * (1.0 + stripeTaxPercent));
  if (denomUncapped <= 0) {
    throw ArgumentError('Invalid fee configuration.');
  }

  final numerUncapped =
      targetNetCents +
      platformFeeCentsOnTarget +
      (stripeFixedCents * (1.0 + stripeTaxPercent));

  int candidateTotal = roundCents(numerUncapped / denomUncapped);

  // ---------- Capped branch ----------
  if (stripePercentCapCents != null) {
    final uncappedPctComponent = stripePercent * candidateTotal;
    final capCents = stripePercentCapCents.toDouble();
    if (uncappedPctComponent > capCents) {
      // T = N + P + (cap + fs)*(1+vat)
      final cappedTotal =
          targetNetCents +
          platformFeeCentsOnTarget +
          ((capCents + stripeFixedCents) * (1.0 + stripeTaxPercent));
      candidateTotal = roundCents(cappedTotal);

      // Fallback if cap not actually binding
      if (stripePercent * candidateTotal < capCents) {
        candidateTotal = roundCents(numerUncapped / denomUncapped);
      }
    }
  }

  // ---------- Final guard ----------
  var result = _buildResult(candidateTotal);
  while (result.ownerNetCents < targetNetCents) {
    candidateTotal += 1;
    result = _buildResult(candidateTotal);
  }

  return result;
}
