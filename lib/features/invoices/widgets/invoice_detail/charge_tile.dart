import 'package:app_ui/app_ui.dart';
import 'package:flutter/cupertino.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/l10n/l10n.dart';

class ChargeTile extends StatelessWidget {
  const ChargeTile({
    required this.description,
    required this.quantity,
    required this.amount,
  });

  final String description;
  final int quantity;
  final double amount;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: 4.edgeInsetsV,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  description.isEmpty ? context.l10n.item : description,
                  style: GLTextStyles.bodyLarge.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                GLSpaces.px4,
                Text(
                  quantity == 1
                      ? context.l10n.oneSession
                      : context.l10n.countSessions(quantity),
                  style: GLTextStyles.bodySmall.copyWith(
                    color: GLColors.neutral700,
                  ),
                ),
              ],
            ),
          ),
          // Right: price
          Text(
            '\$${(amount * quantity).formatWithDecimalsIfHas}',
            style: GLTextStyles.bodyMedium,
          ),
        ],
      ),
    );
  }
}
