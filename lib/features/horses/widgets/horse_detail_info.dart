import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/l10n/l10n.dart';

class ViewDetail extends StatelessWidget {
  const ViewDetail({super.key, this.onPressed});

  final void Function()? onPressed;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          minimumSize: Size.zero,
          textStyle: context.labelSmall,
          padding: [12, 4].edgeInsetsHV,
        ),
        child: Text(context.l10n.viewHorseDetailLabel),
      ),
    );
  }
}
