import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class IconAndText {
  IconAndText({required this.text, required this.iconData});

  final String text;
  final IconData iconData;
}

class IconsAndTextsRow extends StatelessWidget {
  const IconsAndTextsRow({
    required this.items,
    super.key,
  });

  final List<IconAndText> items;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (final i in items) ...[
          Icon(i.iconData, size: 20.sp, color: context.primaryColor),
          GLSpaces.px8,
          Flexible(child: Text(i.text)),
          if (items.indexOf(i) != items.length - 1) GLSpaces.px24,
        ],
      ],
    );
  }
}
