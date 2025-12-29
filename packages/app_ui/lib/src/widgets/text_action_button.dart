// ignore_for_file: public_member_api_docs

import 'package:flutter/material.dart';

class TextActionButton extends StatelessWidget {
  const TextActionButton({
    super.key,
    this.backgroundColor,
    this.fontColor,
    this.textAlign,
    this.borderRadius,
    this.fontWeight = FontWeight.w600,
    this.fontSize = 17,
    this.theme,
    required this.label,
    required this.onPressed,
  });

  final Color? backgroundColor;
  final Color? fontColor;
  final double? fontSize;
  final double? borderRadius;
  final ThemeData? theme;
  final String label;
  final FontWeight? fontWeight;
  final TextAlign? textAlign;
  final dynamic Function()? onPressed;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      style: TextButton.styleFrom(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius ?? 16.0),
        ),
        backgroundColor:
            backgroundColor ?? Theme.of(context).colorScheme.background,
      ),
      onPressed: () {
        onPressed!();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Text(
          label,
          textAlign: textAlign,
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
            color: fontColor ?? Theme.of(context).textTheme.displayLarge!.color,
            fontWeight: fontWeight,
            fontSize: fontSize,
          ),
        ),
      ),
    );
  }
}
