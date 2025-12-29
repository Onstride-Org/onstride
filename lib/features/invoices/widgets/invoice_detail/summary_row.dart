import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

class SummaryRow extends StatelessWidget {
  const SummaryRow({
    required this.label,
    required this.value,
    this.emphasize = false,
  });

  final String label;
  final String value;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    final styleLabel = emphasize
        ? context.titleMedium
        : GLTextStyles.bodyMedium.copyWith(
            color: GLColors.neutralDarkSwatch.shade500,
          );
    final styleValue = emphasize
        ? context.titleMedium
        : GLTextStyles.bodyMedium.copyWith(
            color: GLColors.neutralDarkSwatch.shade500,
          );

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: styleLabel.copyWith(
            color: GLColors.neutralDarkSwatch.shade500,
          ),
        ),
        Text(
          '\$$value',
          style: styleValue
            ..copyWith(
              color: GLColors.neutralDarkSwatch.shade500,
            ),
        ),
      ],
    );
  }
}
