import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/l10n/l10n.dart';

class DownForMaintenanceScreen extends StatelessWidget {
  const DownForMaintenanceScreen({super.key});

  static const path = '/down-for-maintenance';
  static const name = 'down-for-maintenance';

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(l10n.downForMaintenanceTitle),
          const Height(20),
          Text(l10n.downForMaintenanceSubtitle),
        ],
      ),
    );
  }
}
