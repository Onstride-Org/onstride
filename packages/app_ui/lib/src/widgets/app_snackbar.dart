import 'package:app_ui/app_ui.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class AppSnackBarAction {
  AppSnackBarAction({required this.label, required this.action});

  final String label;
  final VoidCallback action;
}

class AppSnackBar extends StatelessWidget {
  const AppSnackBar({
    required this.title,
    this.subtitle,
    this.color,
    this.iconData,
    this.onPressed,
    this.showClose = true,
    this.action,
    super.key,
  });

  factory AppSnackBar.error({
    required String title,
    String? subtitle,
    IconData? iconData,
    bool showClose = true,
    AppSnackBarAction? action,
  }) {
    return AppSnackBar(
      title: title,
      action: action,
      subtitle: subtitle,
      color: GLColors.errorSwatch,
      showClose: showClose,
      iconData: iconData ?? GLIcons.error,
    );
  }

  /// SnackBar for error message
  factory AppSnackBar.success({
    required String title,
    String? subtitle,
    IconData? iconData,
    bool showClose = true,
    AppSnackBarAction? action,
  }) {
    return AppSnackBar(
      title: title,
      subtitle: subtitle,
      showClose: showClose,
      action: action,
      color: GLColors.successSwatch,
      iconData: iconData ?? GLIcons.check,
    );
  }

  /// [AppSnackBar]  for alert message
  factory AppSnackBar.alert({
    required String title,
    String? subtitle,
    IconData? iconData,
    AppSnackBarAction? action,
  }) {
    return AppSnackBar(
      title: title,
      subtitle: subtitle,
      action: action,
      color: GLColors.warningSwatch,
      iconData: iconData ?? GLIcons.alert,
    );
  }

  /// [AppSnackBar] for info message
  factory AppSnackBar.info({
    required String title,
    String? subtitle,
    IconData? iconData,
    VoidCallback? onPressed,
    AppSnackBarAction? action,
  }) {
    return AppSnackBar(
      title: title,
      subtitle: subtitle,
      color: GLColors.brandSwatch,
      onPressed: onPressed,
      iconData: iconData ?? GLIcons.info,
      action: action,
    );
  }

  /// Title
  final String title;

  /// Subtitle
  final String? subtitle;

  /// Color
  final MaterialColor? color;

  /// IconData
  final IconData? iconData;

  /// On press callback
  final VoidCallback? onPressed;

  final bool showClose;
  final AppSnackBarAction? action;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      child: _SnackBarContainer(
        color: color?.shade50,
        child: Row(
          children: [
            10.horizontalSpace,
            _SnackBarIcon(iconData: iconData, color: color?.shade500),
            12.horizontalSpace,
            Expanded(
              child: _TitleAndSubtitleTexts(
                title: title,
                color: GLColors.neutral100,
                subtitle: subtitle,
              ),
            ),
            if (action != null) ...[
              ElevatedButton(
                style: GLButtonStyles.primaryXS.copyWith(
                  backgroundColor: WidgetStatePropertyAll(
                    context.backgroundColor,
                  ),
                  foregroundColor: const WidgetStatePropertyAll(
                    GLColors.neutral200,
                  ),
                  textStyle: WidgetStatePropertyAll(
                    TextStyle(
                      fontSize: 10.sp,
                      fontWeight: FontWeight.w600,
                      letterSpacing: -.4,
                    ),
                  ),
                ),
                onPressed: action!.action,
                child: Text(action!.label),
              ),
            ],
            _CloseButton(showClose),
          ],
        ),
      ),
    );
  }
}

class _SnackBarContainer extends StatelessWidget {
  const _SnackBarContainer({required this.child, required this.color});

  final Widget child;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12.sp),
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 10.sp, vertical: 12.sp),
        child: child,
      ),
    );
  }
}

class _SnackBarIcon extends StatelessWidget {
  const _SnackBarIcon({required this.iconData, required this.color});

  final IconData? iconData;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Icon(iconData, color: color, size: 24.sp);
  }
}

class _CloseButton extends StatelessWidget {
  const _CloseButton(this.showClose);

  final bool showClose;

  @override
  Widget build(BuildContext context) {
    if (!showClose) return const SizedBox.square(dimension: 18);
    return Material(
      color: Colors.transparent,
      child: IconButton(
        onPressed: () => ScaffoldMessenger.of(context).removeCurrentSnackBar(),
        icon: Icon(
          CupertinoIcons.clear,
          color: context.theme.hintColor,
          size: 18.sp,
        ),
      ),
    );
  }
}

class _TitleAndSubtitleTexts extends StatelessWidget {
  const _TitleAndSubtitleTexts({
    required this.title,
    required this.color,
    required this.subtitle,
  });

  final String title;
  final Color? color;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: context.labelLarge.copyWith(
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
        if (subtitle != null) ...[
          Text(
            subtitle!,
            style: context.bodySmall.copyWith(fontWeight: FontWeight.w400),
          ),
        ],
      ],
    );
  }
}
