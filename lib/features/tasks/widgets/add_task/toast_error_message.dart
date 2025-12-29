import 'package:app_ui/app_ui.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/l10n/l10n.dart';

void showErrorToast(BuildContext context, [String? message]) {
  final overlay = Overlay.of(context);
  late final OverlayEntry overlayEntry;
  late final AnimationController animationController;
  late final Animation<Offset> slideAnimation;

  void removeOverlay() {
    if (overlayEntry.mounted) {
      animationController.reverse().then((_) {
        if (overlayEntry.mounted) {
          overlayEntry.remove();
        }
      });
    }
  }

  animationController = AnimationController(
    duration: const Duration(milliseconds: 300),
    vsync: Navigator.of(context),
  );

  slideAnimation =
      Tween<Offset>(
        begin: const Offset(0, 1),
        end: Offset.zero,
      ).animate(
        CurvedAnimation(
          parent: animationController,
          curve: Curves.easeOut,
        ),
      );

  overlayEntry = OverlayEntry(
    builder: (context) => Positioned(
      bottom: MediaQuery.of(context).padding.bottom + 16,
      left: 16,
      right: 16,
      child: SlideTransition(
        position: slideAnimation,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {},
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: GLColors.errorSwatch.shade50,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 12,
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 10),
                    Icon(
                      GLIcons.error,
                      color: GLColors.errorSwatch.shade500,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        message ?? context.l10n.completeAllRequiredFieldsMsg,
                        style: context.labelLarge.copyWith(
                          fontWeight: FontWeight.w600,
                          color: GLColors.errorSwatch.shade600,
                        ),
                      ),
                    ),
                    Material(
                      color: Colors.transparent,
                      child: IconButton(
                        onPressed: removeOverlay,
                        icon: Icon(
                          CupertinoIcons.clear,
                          color: context.theme.hintColor,
                          size: 18,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
  overlay.insert(overlayEntry);
  animationController.forward();
  Future.delayed(const Duration(seconds: 4), removeOverlay);
}
