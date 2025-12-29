import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

/// Visual tile for payment method selection (bordered, pill on selected)
class PaymentMethodRadioButton extends StatelessWidget {
  const PaymentMethodRadioButton({
    required this.selected,
    required this.title,
    required this.subtitle,
    required this.onTap,
    super.key,
  });

  final bool selected;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final borderColor = selected ? GLColors.brand500 : GLColors.neutral1100;
    final bgColor = selected
        ? GLColors.brand50
        : GLColors.brand50.withValues(alpha: 0);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: kThemeAnimationDuration,
        padding: 12.edgeInsetsA,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: selected ? GLColors.brand500 : GLColors.neutral700,
            ),
            GLSpaces.px12,
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    title,
                    style: GLTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  GLSpaces.px4,
                  Text(
                    subtitle,
                    style: GLTextStyles.labelSmall.copyWith(
                      color: GLColors.neutral700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
