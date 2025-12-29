import 'package:auth_repository/auth_repository.dart';
import 'package:database_client/database_client.dart';
import 'package:firebase_authentication_client/firebase_authentication_client.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_remote_config_client/firebase_remote_config_client.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:gl_horses/core/core.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart' as path;

// Mobile-only imports - conditionally loaded
import 'package:gl_horses/main_mobile.dart'
    if (dart.library.html) 'package:gl_horses/main_web_stub.dart' as mobile;

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

// Main entry
Future<void> mainCommon({
  required FlavorConfig config,
  required FirebaseOptions options,
}) async {
  WidgetsFlutterBinding.ensureInitialized();

  // await _loadEnv(config);
  await _initializeHive();
  await _initializeFirebase(options);
  await _lockOrientation();
  if (!kIsWeb) {
    Stripe.publishableKey = config.stripePublishableKey;
  }
  final authClient = _createAuthClient();
  final authRepo = AuthRepository(
    authenticationClient: authClient,
  );

  final info = await PackageInfo.fromPlatform();
  final remoteConfig = FirebaseRemoteConfigClient();
  await remoteConfig.initialize();

  final container = ProviderContainer(
    observers: [AppProviderObserver()],
    overrides: [
      flavorConfigProvider.overrideWithValue(
        config.copyWith(
          buildNumber: int.tryParse(info.buildNumber) ?? 0,
          version: info.version,
        ),
      ),
      authRepositoryProvider.overrideWithValue(authRepo),
      remoteConfigClientProvider.overrideWith((_) => remoteConfig),
    ],
  );

  if (!kIsWeb) {
    await _initializePushNotifications(container);
    await mobile.setupAppsFlyer(container);
  }
  runApp(
    UncontrolledProviderScope(
      container: container,
      child: GLHorsesApp(flavor: config),
    ),
  );

  FlutterError.demangleStackTrace = (stack) {
    // if (stack is stack_trace.Trace) return stack.vmTrace;
    // if (stack is stack_trace.Chain) return stack.toTrace().vmTrace;
    return stack;
  };
}

// ENV
// Future<void> _loadEnv(FlavorConfig config) async {
//   final dotenv = DotEnv();
//   await dotenv.load(
//     fileName: 'env-${config.appEnvironment.name.toLowerCase()}',
//   );
// }

// Firebase
Future<void> _initializeFirebase(FirebaseOptions options) async {
  await Firebase.initializeApp(options: options);
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    await mobile.setHighRefreshRate();
  }
  // await FirebaseAppCheck.instance.activate(
  //   appleProvider: AppleProvider.appAttestWithDeviceCheckFallback,
  // );
  if (kDebugMode) return;
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
}

// Push Notifications
Future<void> _initializePushNotifications(ProviderContainer container) async {
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  final pushNotificationsService = PushNotificationsService();
  await pushNotificationsService.initialize(container: container);
}

// Hive
Future<void> _initializeHive() async {
  Hive
    ..registerAdapter<GLUserDb>(GLUserDbAdapter())
    ..registerAdapter<AccountTypeDb>(AccountTypeDbAdapter());

  if (kIsWeb) {
    await Hive.initFlutter();
  } else {
    final dir = await path.getTemporaryDirectory();
    await Hive.initFlutter(dir.path);
  }
  await Hive.openBox('prefs');
  await Hive.openBox<GLUserDb>('user');
}

// Orientation
Future<void> _lockOrientation() async {
  if (!kIsWeb) {
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  }
}

// Auth
FirebaseAuthenticationClient _createAuthClient() {
  return FirebaseAuthenticationClient();
}

