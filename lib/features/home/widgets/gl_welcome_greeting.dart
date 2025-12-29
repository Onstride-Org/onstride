import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class GLWelcomeGreeting extends StatelessWidget {
  const GLWelcomeGreeting({
    required this.user,
    super.key,
  });

  final GLUser user;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          '${context.l10n.welcomeBack(user.name?.split(' ').first ?? '')}!',
          style: context.titleLarge,
        ),
      ),
    );
  }
}
