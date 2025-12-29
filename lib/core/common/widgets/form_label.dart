import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

class FormLabel extends StatelessWidget {
  const FormLabel(this.text, {super.key, this.color});

  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: context.bodyMedium.copyWith(
        fontWeight: FontWeight.w400,
        color: color,
      ),
    );
  }
}
