import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class SummaryRowWithTooltip extends StatelessWidget {
  const SummaryRowWithTooltip({
    super.key,
    required this.label,
    required this.value,
    required this.tooltip,
  });

  final String label;
  final String value;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Text(
              label,
              style: GLTextStyles.bodyMedium.copyWith(
                color: GLColors.neutralDarkSwatch.shade500,
              ),
            ),
            GLSpaces.px4,
            ClickTooltip(
              message: tooltip,
              showOffset: const Offset(80, 0),
              child: Icon(
                Icons.info_outline,
                size: 14.sp,
                color: GLColors.neutral700,
              ),
            ),
          ],
        ),
        Text(
          value,
          style: GLTextStyles.bodyMedium.copyWith(
            color: GLColors.neutralDarkSwatch.shade500,
          ),
        ),
      ],
    );
  }
}
