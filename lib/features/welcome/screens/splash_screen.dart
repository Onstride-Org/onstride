import 'dart:async';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/auth/auth.dart';
import 'package:gl_horses/features/home/screens/home_screen.dart';
import 'package:go_router/go_router.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  static const String path = '/';
  static const String name = 'splash';

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  Timer? _startupWatchdog;

  @override
  void initState() {
    _startupWatchdog = Timer(const Duration(seconds: 5), () {
      if (mounted) {
        context.goNamed(LoginScreen.name);
      }
    });
    super.initState();
  }

  @override
  void dispose() {
    _startupWatchdog?.cancel();
    super.dispose();
  }

  void _stateListener(
    BuildContext context,
    AppState next,
  ) {
    switch (next) {
      case InitAppState():
        return;
      case UnauthenticatedAppState():
        return context.goNamed(LoginScreen.name);
      case AuthenticatedAppState():
        return;
      case NeedsToFinishRegistrationAppState():
        return context.goNamed('finish-registration');
      case DownForMaintenance():
        return context.goNamed(DownForMaintenanceScreen.name);
      case ForceUpgradeRequired():
        return context.goNamed(ForceUpgradeScreen.name);
    }
  }

  void _accountListener(AccountState next, BuildContext context) {
    switch (next) {
      case InitialAccountState():
      case LoadingAccountState():
        return;
      case SuccessAccountState():
        final user = next.user;
        final name = user.name;
        if (name == null || name.isEmpty) {
          ref.read(authRepositoryProvider).logOut();
        } else {
          context.goNamed(HomeScreen.name);
        }
        return;
      case UpdatingAccountState():
        return;
      case ErrorAccountState(:final exception):
        context.showDataException(exception);
        ref.read(authRepositoryProvider).logOut();
    }
  }

  @override
  Widget build(BuildContext context) {
    ref
      ..watch(appInitializerProvider)
      ..listen(
        appStateProvider,
        (_, next) => _stateListener(context, next),
      )
      ..listen(
        accountProvider,
        (_, next) => _accountListener(next, context),
      );
    return Scaffold(
      backgroundColor: context.primaryColor,
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Center(
            child: Assets.images.textLogo.image(
              height: 30.h,
            ),
          ),
          GLSpaces.px8,
          SizedBox(
            width: 50.w,
            child: LinearProgressIndicator(
              borderRadius: 9.borderRadiusA,
              stopIndicatorRadius: 10,
              color: Colors.white,
              backgroundColor: Colors.transparent,
            ),
          ),
        ],
      ),
    );
  }
}
