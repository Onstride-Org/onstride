// ignore_for_file: public_member_api_docs

import 'package:app_ui/src/widgets/widgets.dart';
import 'package:flutter/material.dart';

enum ActionButtonType { primary, secondary }

class ActionButton extends StatelessWidget {
  const ActionButton({
    super.key,
    this.buttonType = ActionButtonType.primary,
    this.icon,
    this.textAlign,
    this.elevation,
    this.borderRadius = 30,
    this.isDisabled = false,
    this.isExpanded = true,
    this.padding,
    this.isLoading = false,
    this.fontWeight = FontWeight.w600,
    this.fontSize = 18,
    this.label,
    required this.onPressed,
  });
  final Image? icon;

  final double? fontSize;
  final double? borderRadius;
  final EdgeInsetsGeometry? padding;
  final ActionButtonType buttonType;
  final String? label;
  final double? elevation;
  final FontWeight? fontWeight;
  final TextAlign? textAlign;
  final bool? isDisabled;
  final dynamic Function()? onPressed;
  final bool isExpanded;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Row(
        children: [
          Expanded(child: SizedBox()),
          CircularProgressIndicator(),
          Expanded(child: SizedBox()),
        ],
      );
    }
    final backgroundColor = getBackgroundColor(context);
    final fontColor =
        backgroundColor.computeLuminance() > 0.5 ? Colors.black : Colors.white;

    final style = TextButton.styleFrom(
      elevation: elevation ?? 0,
      padding: padding ??
          const EdgeInsets.symmetric(
            vertical: 20,
            horizontal: 30,
          ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(borderRadius ?? 30),
      ),
      backgroundColor: backgroundColor,
    );
    final buttonLabel = Text(
      label ?? '',
      textAlign: textAlign,
      style: TextStyle(
        fontSize: fontSize,
        color: fontColor,
        fontWeight: fontWeight,
      ),
    );
    if (icon != null && label != null) {
      return ElevatedButton(
        style: style,
        onPressed: isDisabled == true ? null : onPressed,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [icon!, const Width(10), buttonLabel],
        ),
      );
    } else if (icon != null && label == null) {
      return Ink(
        padding: const EdgeInsets.all(5),
        decoration: ShapeDecoration(
          color: backgroundColor,
          shape: const CircleBorder(),
        ),
        child: IconButton(
          enableFeedback: true,
          visualDensity: VisualDensity.standard,
          onPressed: isDisabled == true ? null : onPressed,
          color: backgroundColor,
          icon: icon!,
        ),
      );
    }
    final button = ElevatedButton(
      style: style,
      onPressed: isDisabled == true ? null : onPressed,
      child: buttonLabel,
    );
    if (isExpanded) {
      return Row(
        children: [Expanded(child: button)],
      );
    } else {
      return button;
    }
  }

  // Color getFontColor(BuildContext context) {
  //   if (isDisabled == true) {
  //     return Theme.of(context).colorScheme.secondary.withAlpha(150);
  //   }
  //   switch (buttonType) {
  //     case ActionButtonType.primary:
  //       return Theme.of(context).colorScheme.secondary;
  //     case ActionButtonType.secondary:
  //       return Theme.of(context).colorScheme.primary;
  //   }
  // }

  Color getBackgroundColor(BuildContext context) {
    if (isDisabled == true) {
      return Theme.of(context).colorScheme.surface;
    }
    switch (buttonType) {
      case ActionButtonType.primary:
        return Theme.of(context).colorScheme.primary;
      case ActionButtonType.secondary:
        return Theme.of(context).colorScheme.surface;
    }
  }

  // Color getForegroundColor(BuildContext context) {
  //   if (isDisabled == true) {
  //     return AppColors.textSwatch;
  //   }
  //   switch (buttonType) {
  //     case ActionButtonType.primary:
  //       return Theme.of(context).textTheme.displayLarge!.color!;
  //     case ActionButtonType.secondary:
  //       return Theme.of(context).textTheme.headlineSmall!.color!;
  //   }
  // }
}
