import 'dart:developer';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:models/models.dart';

/// Displays the payment method used (e.g. Visa ending in 1234 or ACH ending in 5678)
class PaymentMethodTile extends StatelessWidget {
  const PaymentMethodTile({
    super.key,
    required this.stripeInfo,
  });

  final StripePaymentInfo? stripeInfo;

  SvgGenImage? _resolveBrandAsset() {
    final type = stripeInfo?.paymentMethodType?.toLowerCase();
    final brand = stripeInfo?.cardBrand?.toLowerCase();
    const creditCards = Assets.creditCards;
    if (stripeInfo == null) return null;
    log('${stripeInfo?.toJson()}');
    if (type == 'us_bank_account' || type == 'ach') {
      return null;
    }

    switch (brand) {
      case 'visa':
        return creditCards.visa;
      case 'mastercard':
        return creditCards.mastercard;
      case 'amex':
      case 'american express':
        return creditCards.amex;
      case 'discover':
        return creditCards.discover;
      case 'diners':
      case 'diners club':
        return creditCards.diners;
      case 'jcb':
        return creditCards.jcb;
      case 'unionpay':
        return creditCards.unionpay;
      case 'elo':
        return creditCards.elo;
      case 'hiper':
        return creditCards.hiper;
      case 'hipercard':
        return creditCards.hipercard;
      case 'maestro':
        return creditCards.maestro;
      case 'mir':
        return creditCards.mir;
      case 'alipay':
        return creditCards.alipay;
      case 'paypal':
        return creditCards.paypal;
      default:
        return creditCards.generic;
    }
  }

  /// Returns formatted text like "Ending in 1234"
  String get _suffix {
    final type = stripeInfo?.paymentMethodType;
    if (type == 'card' && stripeInfo?.cardLast4 != null) {
      return 'Ending in ${stripeInfo!.cardLast4}';
    } else if (type == 'us_bank_account' && stripeInfo?.bankLast4 != null) {
      return 'Account •••• ${stripeInfo!.bankLast4}';
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final label = stripeInfo?.paymentMethodType == 'us_bank_account'
        ? 'Bank Account'
        : (stripeInfo?.cardBrand?.toUpperCase() ?? '----');

    return Container(
      padding: 10.edgeInsetsV.copyWith(bottom: 20),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'Payment method',
              style: GLTextStyles.bodyLarge,
            ),
          ),
          _resolveBrandAsset()?.svg(height: 20, width: 50) ??
              const Icon(
                Icons.account_balance_sharp,
                color: GLColors.neutral700,
              ),
          const SizedBox(width: 8),
          Text(
            _suffix.isNotEmpty ? _suffix : label,
            style: GLTextStyles.bodySmall.copyWith(
              color: GLColors.neutral700,
            ),
          ),
        ],
      ),
    );
  }
}
