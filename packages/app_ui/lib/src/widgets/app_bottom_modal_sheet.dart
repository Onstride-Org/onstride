// ignore_for_file: public_member_api_docs

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

mixin AppBottomSheet {
  // static get(
  //   BuildContext context, {
  //   required Widget body,
  //   required String title,
  // }) async {
  //   FocusScope.of(context).requestFocus(FocusNode());
  //   return showModalBottomSheet(
  //     context: context,
  //     isScrollControlled: true,
  //     backgroundColor: WPalette.level2,
  //     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
  //     builder: (context) => WBottomSheetBody(title: title, child: body),
  //   );
  // }

  static Future<void> get(
    BuildContext context, {
    required Widget body,
    required String title,
  }) async {
    FocusScope.of(context).requestFocus(FocusNode());
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(40),
          topRight: Radius.circular(40),
        ),
      ),
      builder: (context) => WBottomSheetBodyNew(title: title, child: body),
    );
  }

  static Future<void> getConfirmation(
    BuildContext context, {
    required String subtitle,
    required String title,
    String? notes,
    String? acceptLabel,
    String? cancelLabel,
    void Function()? onAccept,
    void Function()? onCancel,
  }) async {
    FocusScope.of(context).requestFocus(FocusNode());
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(40),
          topRight: Radius.circular(40),
        ),
      ),
      builder: (context) => WConfirmationBottomSheetBody(
        subtitle: subtitle,
        title: title,
        notes: notes,
        acceptLabel: acceptLabel,
        cancelLabel: cancelLabel,
        onAccept: onAccept,
        onCancel: onCancel,
      ),
    );
  }

  static Future<void> getFullScreen(
    BuildContext context, {
    required Widget body,
    required String title,
    bool? applyPadding = true,
    Widget? background,
  }) async {
    FocusScope.of(context).requestFocus(FocusNode());
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(10),
          topRight: Radius.circular(10),
        ),
      ),
      builder: (context) => WBottomSheetFullScreenBody(
        applyPadding: applyPadding,
        title: title,
        background: background,
        child: body,
      ),
    );
  }
}

class WBottomSheetBody extends StatelessWidget {
  const WBottomSheetBody({super.key, required this.child, required this.title});
  final Widget child;
  final String title;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              IconButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                icon: Icon(
                  Icons.close,
                  color: Theme.of(context).colorScheme.primary,
                ),
              )
            ],
          ),
          const SizedBox(height: 20),
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.7,
            ),
            child: child,
          )
        ],
      ),
    );
  }
}

class WBottomSheetBodyNew extends StatelessWidget {
  const WBottomSheetBodyNew({
    super.key,
    required this.child,
    required this.title,
  });
  final Widget child;
  final String title;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              IconButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                icon: Icon(
                  Icons.close,
                  color: Theme.of(context).colorScheme.secondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.7,
            ),
            child: child,
          )
        ],
      ),
    );
  }
}

class WConfirmationBottomSheetBody extends StatelessWidget {
  const WConfirmationBottomSheetBody({
    super.key,
    required this.title,
    required this.subtitle,
    this.notes,
    this.acceptLabel,
    this.cancelLabel,
    this.onAccept,
    this.onCancel,
  });
  final String title;
  final String subtitle;
  final String? acceptLabel;
  final String? cancelLabel;
  final String? notes;
  final void Function()? onAccept;
  final void Function()? onCancel;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 48),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          if (notes != null)
            Text(
              notes!,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
          const SizedBox(height: 47),
          if (onAccept != null)
            ActionButton(onPressed: onAccept, label: acceptLabel ?? 'Accept'),
          if (onAccept != null && onCancel != null) const SizedBox(height: 24),
          if (onCancel != null)
            TextActionButton(
              onPressed: onCancel,
              label: cancelLabel ?? 'Cancel',
            )
        ],
      ),
    );
  }
}

class WBottomSheetFullScreenBody extends StatelessWidget {
  const WBottomSheetFullScreenBody({
    super.key,
    required this.child,
    this.background,
    required this.applyPadding,
    required this.title,
  });
  final Widget child;
  final String title;
  final Widget? background;
  final bool? applyPadding;
  @override
  Widget build(BuildContext context) {
    final titleRow = Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        InkWell(
          onTap: () {
            Navigator.pop(context);
          },
          child: Icon(
            Icons.close,
            color: Theme.of(context).colorScheme.primary,
          ),
        )
      ],
    );
    final body = Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: titleRow,
        ),
        const SizedBox(height: 16),
        if (title != '')
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(height: 1, color: Colors.white.withOpacity(0.4)),
          ),
        const SizedBox(height: 20),
        child
      ],
    );
    if (background != null) {
      return SizedBox(
        height: MediaQuery.of(context).size.height * 0.93,
        child: Stack(
          children: [
            background!,
            if (applyPadding == true)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: body,
              )
            else
              body
          ],
        ),
      );
    }
    return Container(
      height: MediaQuery.of(context).size.height * 0.93,
      padding: applyPadding == true
          ? const EdgeInsets.symmetric(horizontal: 16)
          : null,
      child: body,
    );
  }
}
