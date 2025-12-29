import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/common/dialogs/otso_base_dialog.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';

class ConfirmDialog extends StatelessWidget {
  const ConfirmDialog._({
    required this.title,
    this.description,
    this.caption,
    this.confirmText,
    this.cancelText,
    this.confirmButtonColor,
  });

  final String title;
  final String? description;
  final String? confirmText;
  final Color? confirmButtonColor;
  final String? cancelText;
  final Widget? caption;

  static Future<bool?> show(
    BuildContext context, {
    required String title,
    String? description,
    Widget? caption,
    String? confirmText,
    Color? confirmButtonColor,
    String? cancelText,
  }) async {
    return showDialog<bool?>(
      context: context,
      barrierColor: Colors.black12,
      builder: (context) => ConfirmDialog._(
        title: title,
        description: description,
        caption: caption,
        confirmText: confirmText,
        cancelText: cancelText,
        confirmButtonColor: confirmButtonColor,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GLBaseDialog(
      title: Text(
        title,
        textAlign: TextAlign.left,
        style: context.titleMedium,
      ),
      description: description != null
          ? Text(
              description!,
              textAlign: TextAlign.left,
              style: context.bodySmall.copyWith(
                color: GLColors.neutral600,
                fontWeight: FontWeight.w400,
              ),
            )
          : null,
      children: [
        if (caption != null) ...[caption!],
        GLSpaces.px12,
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            OutlinedButton(
              onPressed: () => context.pop(false),
              style: GLButtonStyles.outlineM.copyWith(
                fixedSize: WidgetStatePropertyAll(Size.fromHeight(30.h)),
              ),
              child: Text(cancelText ?? context.l10n.cancel),
            ),
            GLSpaces.px8,
            Expanded(
              child: ElevatedButton(
                onPressed: () => context.pop(true),
                style: GLButtonStyles.errorM.copyWith(
                  fixedSize: WidgetStatePropertyAll(Size.fromHeight(30.h)),
                ),
                child: Text(confirmText ?? 'Confirm'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
