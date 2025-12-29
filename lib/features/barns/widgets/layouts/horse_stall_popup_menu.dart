import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/l10n/l10n.dart';

class HorseStallPopupMenu extends StatelessWidget {
  const HorseStallPopupMenu({
    required this.onTapViewHorse,
    required this.onTapDelete,
    required this.child,
    required this.enabled,
    super.key,
  });

  final VoidCallback onTapViewHorse;
  final VoidCallback onTapDelete;
  final Widget child;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return GLPopupMenuButton(
      items: enabled
          ? [
              GLPopupItem<void>(
                onTap: onTapViewHorse,
                height: 16.sp,
                color: GLColors.brand700,
                child: Row(
                  children: [
                    const Icon(GLIcons.horse),
                    GLSpaces.px4,
                    Text(
                      context.l10n.viewHorseInfo,
                    ),
                  ],
                ),
              ),
              GLPopupItem<void>(
                onTap: onTapDelete,
                height: 16.sp,
                color: GLColors.error400,
                child: Row(
                  children: [
                    const Icon(GLIcons.trash),
                    GLSpaces.px4,
                    Text(
                      context.l10n.unassignHorse,
                    ),
                  ],
                ),
              ),
            ]
          : [],
      child: child,
    );
  }
}
