// Main App Widget
import 'dart:developer';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/invitations/screens/screens.dart';
import 'package:gl_horses/l10n/gen_l10n/app_localizations.dart';
import 'package:keyboard_dismisser/keyboard_dismisser.dart';

final rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

class GLHorsesApp extends ConsumerWidget {
  const GLHorsesApp({
    required this.flavor,
    super.key,
  });

  final FlavorConfig flavor;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(prefsProvider);
    final router = ref.watch(appRouterProvider);
    final remoteTextScaler = ref
        .read(remoteConfigClientProvider)
        .getDouble('text_scaler');
    ref.listen(
      deepLinkProvider,
      (previous, next) {
        log('Listen new DeepLink Value ${next?.value}');
        log('Listen new DeepLink Data ${next?.data}');
        final invitationId = next?.data['deep_link_sub1'];
        if (next?.value == 'invitation' && invitationId != null) {
          router.goNamed(
            CreateAccountInvitationScreen.name,
            queryParameters: {'invitationId': invitationId},
          );
        }
      },
    );
    return ScreenUtilInit(
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return MaterialApp.router(
          title: flavor.name,
          scaffoldMessengerKey: rootScaffoldMessengerKey,
          theme: GLTheme.lightTheme,
          darkTheme: GLTheme.lightTheme,
          themeMode: prefs.themeMode,
          locale: prefs.locale,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          routerConfig: router,
          builder: (context, child) => KeyboardDismisser(
            child: MediaQuery(
              data: context.mediaQuery.copyWith(
                textScaler: TextScaler.linear(remoteTextScaler),
              ),
              child: child!,
            ),
          ),
          debugShowCheckedModeBanner: false,
        );
      },
    );
  }
}
