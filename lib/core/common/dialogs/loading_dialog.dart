import 'package:app_ui/app_ui.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

/// Load dialog for waiting on remote request launches

void showLoadingDialog(
  BuildContext context, {
  Alignment loaderAlignment = Alignment.center,
  Color? barrierColor,
}) {
  showDialog<void>(
    context: context,
    barrierDismissible: false,
    useRootNavigator: false,
    barrierColor: barrierColor ?? context.backgroundColor,
    builder: (context) {
      return _LoadingDialogContainer(
        alignment: loaderAlignment,
      );
    },
  );
}

void showInvisibleLoadingDialog(
  BuildContext context, {
  Alignment loaderAlignment = Alignment.center,
  Color? barrierColor,
}) {
  showDialog<void>(
    context: context,
    barrierDismissible: kDebugMode,
    useRootNavigator: false,
    barrierColor: Colors.black12,
    builder: (context) {
      return Center(
        child: GLBouncingDotsIndicator(
          spacing: 5.w,
          size: 6.sp,
          color: Colors.white,
        ),
      );
    },
  );
}

class _LoadingDialogContainer extends StatelessWidget {
  const _LoadingDialogContainer({
    super.key,
    required this.alignment,
  });

  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: kDebugMode ? context.pop : null,
      child: Align(
        alignment: alignment,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Center(
              child: Assets.images.textLogo.image(
                height: 20.h,
                color: context.primaryColor,
              ),
            ),
            GLSpaces.px8,
            Center(
              child: GLBouncingDotsIndicator(
                spacing: 5.w,
                size: 6.sp,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
