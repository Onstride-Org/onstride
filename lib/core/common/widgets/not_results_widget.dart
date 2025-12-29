import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class NotResultsWidget extends StatelessWidget {
  const NotResultsWidget({
    super.key,
    required this.title,
    required this.description,
    required this.icon,
    this.onRefresh,
    this.alignment = Alignment.center,
  });

  factory NotResultsWidget.search({
    String? title,
    String? description,
    VoidCallback? refresh,
    Alignment alignment = Alignment.center,
  }) => NotResultsWidget(
    title: title ?? 'No results found',
    description:
        description ??
        'No results matched your search. Please try another search.',
    icon: const Icon(GLIcons.no_search),
    onRefresh: refresh,
    alignment: alignment,
  );

  factory NotResultsWidget.data({
    required String title,
    required String description,
    Alignment alignment = Alignment.center,
    VoidCallback? refresh,
  }) => NotResultsWidget(
    title: title,
    description: description,
    onRefresh: refresh,
    alignment: alignment,
    icon: Assets.images.empty.image(height: 90),
  );

  final Widget icon;
  final String title;
  final String description;
  final VoidCallback? onRefresh;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    final color = context.primaryColorDark;
    return Align(
      alignment: alignment,
      child: SizedBox(
        width: 310,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            icon,
            Text(
              title,
              style: context.titleLarge.copyWith(color: color, fontSize: 18.sp),
              textAlign: TextAlign.center,
            ),
            Text(
              description,
              style: context.bodySmall.copyWith(color: color),
              textAlign: TextAlign.center,
            ),
            if (onRefresh != null) ...[
              gap12,
              TextButton.icon(
                onPressed: onRefresh,
                style: TextButton.styleFrom(
                  fixedSize: const Size.fromHeight(32),
                  padding: 10.edgeInsetsH,
                  textStyle: context.labelSmall,
                ),
                icon: const Icon(Icons.refresh),
                label: const Text('Reload'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
