import 'dart:ui';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

class GLBaseDialog extends StatelessWidget {
  const GLBaseDialog({
    super.key,
    required this.title,
    required this.children,
    this.description,
    this.isLoading = false,
  });

  final bool isLoading;
  final Widget title;
  final Widget? description;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        BackdropFilter(
          filter: ImageFilter.blur(sigmaY: 3, sigmaX: 3),
          child: const ColoredBox(color: Colors.transparent),
        ),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 0.1.sw),
          child: Center(
            child: Material(
              type: MaterialType.transparency,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: 12.borderRadiusA,
                ),
                child: Opacity(
                  opacity: isLoading ? 0 : 1,
                  child: Stack(
                    alignment: Alignment.topRight,
                    children: [
                      Padding(
                        padding: 16.edgeInsetsA,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            DefaultTextStyle(
                              style: context.headlineSmall,
                              textAlign: TextAlign.center,
                              child: title,
                            ),
                            if (description != null) ...[
                              gap8,
                              DefaultTextStyle(
                                style: context.bodySmall,
                                textAlign: TextAlign.center,
                                child: description!,
                              ),
                            ],
                            ...children,
                          ],
                        ),
                      ),

                      IconButton(
                        onPressed: () => context.pop(),
                        icon: const Icon(GLIcons.x),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        if (isLoading)
          const Center(
            child: GLBouncingDotsIndicator(),
          ),
      ],
    );
  }
}
