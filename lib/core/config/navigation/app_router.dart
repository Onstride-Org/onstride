import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/horses/screens/horse_profile_view.dart';
import 'package:gl_horses/features/invitations/invitations.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

part 'routes.dart';

final appRouterProvider = Provider<GoRouter>(
  (ref) {
    return GoRouter(
      initialLocation: SplashScreen.path,
      routes: routes,
      debugLogDiagnostics: kDebugMode,

      redirect: (BuildContext context, GoRouterState state) {
        final location = state.matchedLocation;
        final appState = ref.read(appStateProvider);
        final uri = state.uri;
        if (uri.host == 'onstride.onelink.me') {
          return SplashScreen.path;
        }
        // ---- INVITATION SCREEN PATH ----
        const invitationPath = CreateAccountInvitationScreen.path;

        switch (appState) {
          case InitAppState():
            return null;

          // ---- USER NOT AUTHENTICATED ----
          case UnauthenticatedAppState():
            return null;

          // ---- USER AUTHENTICATED ----
          case AuthenticatedAppState():
            if (location.startsWith(invitationPath)) {
              return HomeScreen.path;
            }
            return null;

          // ---- NEEDS REG COMPLETION ----
          case NeedsToFinishRegistrationAppState():
            return null;

          // ---- MAINTENANCE ----
          case DownForMaintenance():
            return null;

          // ---- FORCE UPGRADE ----
          case ForceUpgradeRequired():
            return null;
        }
        return null;
        // switch (status) {
        //   case AppStatus.downForMaintenance:
        //     if (location == DownForMaintenanceScreen.path) {
        //       return null;
        //     }
        //     return DownForMaintenanceScreen.path;
        //
        //   case AppStatus.forceUpgradeRequired:
        //     if (location == ForceUpgradeScreen.path) {
        //       return null;
        //     }
        //     return ForceUpgradeScreen.path;
        //   case AppStatus.authenticated:
        // if (location == LoginScreen.path) {
        //   return '/';
        // }
        // if (location == CreateAccountScreen.path) {
        //   return '/';
        // }
        // if (location == SplashScreen.path) {
        //   return '/';
        // }
        // if (location == DownForMaintenanceScreen.path) {
        //   return '/';
        // }

        //   return null;
        //
        // case AppStatus.unauthenticated:
        //   if (location == LoginScreen.path) {
        //     return null;
        //   }
        //   if (location == CreateAccountScreen.path) {
        //     return null;
        //   }
        //   if (location == ResetPasswordScreen.path) {
        //     return null;
        //   }
        //   return LoginScreen.path;
        // case AppStatus.needsVerification:
        //   return null;
        // case AppStatus.init:
        //   return SplashScreen.path;
        // case AppStatus.needsToFinishRegistration:
        //   return null;
        // case AppStatus.loadingUser:
        //   return SplashScreen.path;
        // }
        // return null;
      },
    );
  },
);
