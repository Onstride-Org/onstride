import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class GLPopupMenuButton<T> extends StatelessWidget {
  const GLPopupMenuButton({
    super.key,
    required this.items,
    required this.child,
    this.onSelected,
    this.icon,
    this.trailing,
    this.foregroundColor,
    this.backgroundColor,
    this.borderSide = BorderSide.none,
    this.padding,
    this.itemHeight = 36,
  });

  final List<GLPopupItem<T>> items;
  final ValueChanged<T>? onSelected;
  final Widget child;
  final Widget? icon;
  final Widget? trailing;
  final Color? foregroundColor;
  final Color? backgroundColor;
  final BorderSide borderSide;
  final EdgeInsets? padding;
  final double itemHeight;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<T>(
      tooltip: '',
      onSelected: onSelected,
      itemBuilder: (context) {
        const hintColor = GLColors.neutral300;
        final textStyle = context.labelSmall.copyWith(
          color: hintColor,
          letterSpacing: 0,
          fontWeight: FontWeight.w400,
        );
        return [
          for (final item in items) ...[
            PopupMenuItem(
              height: (item.height ?? itemHeight).h,
              onTap: item.onTap,
              value: item.value,
              labelTextStyle: WidgetStatePropertyAll(textStyle),
              textStyle: textStyle,
              child: IconTheme(
                data: context.iconTheme.copyWith(
                  color: item.color ?? hintColor,
                  size: context.bodyLarge.fontSize,
                ),
                child: DefaultTextStyle(
                  style: textStyle.copyWith(color: item.color ?? hintColor),
                  child: item.child,
                ),
              ),
            ),
          ],
        ];
      },
      offset: const Offset(10, 50),
      shape: RoundedRectangleBorder(borderRadius: 8.borderRadiusA),
      shadowColor: context.shadowColor,
      color: context.backgroundColor,
      style: ElevatedButton.styleFrom(
        foregroundColor: foregroundColor,
        splashFactory: NoSplash.splashFactory,
        backgroundColor: backgroundColor,
        shape: RoundedRectangleBorder(
          borderRadius: 8.borderRadiusA,
          side: borderSide,
        ),
        padding: padding ?? EdgeInsets.zero,
      ),
      icon: DefaultTextStyle(
        style: context.bodyMedium.copyWith(color: foregroundColor),
        child: Row(
          children: [
            if (trailing != null) ...[trailing!, gap8],
            child,
            if (icon != null) ...[gap8, icon!],
          ],
        ),
      ),
    );
  }
}

class GLPopupItem<T> {
  GLPopupItem({
    this.value,
    this.onTap,
    required this.child,
    this.color,
    this.height,
  });

  final Widget child;
  final Color? color;
  final double? height;
  final VoidCallback? onTap;
  final T? value;
}
