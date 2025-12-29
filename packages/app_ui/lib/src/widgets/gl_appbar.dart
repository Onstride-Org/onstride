import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

class GLAppBar extends StatelessWidget implements PreferredSizeWidget {
  const GLAppBar({super.key, this.title, this.leading, this.actions});

  final Widget? title;
  final Widget? leading;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: title,
      leading: leading != null
          ? Padding(padding: const EdgeInsets.only(left: 24), child: leading)
          : null,
      actions: actions?.map((action) {
        return Padding(padding: 24.edgeInsetsR, child: action);
      }).toList(),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
