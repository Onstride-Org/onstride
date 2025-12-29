// ignore_for_file: prefer_const_constructors, avoid_dynamic_calls, lines_longer_than_80_chars
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_core_platform_interface/firebase_core_platform_interface.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:firebase_remote_config_client/firebase_remote_config_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:remote_config_client/remote_config_client.dart';

class MockRemoteConfig extends Mock implements FirebaseRemoteConfig {}

class FakeRemoteConfigSettings extends Fake implements RemoteConfigSettings {}

void main() {
  group('FirebaseRemoteConfigClient', () {
    TestWidgetsFlutterBinding.ensureInitialized();
    // setupFiresbaseCoreMocks();

    TestWidgetsFlutterBinding.ensureInitialized();
    Firebase.initializeApp();

    late FirebaseRemoteConfig remoteConfig;
    late FirebaseRemoteConfigClient firebaseRemoteConfigClient;

    setUp(() {
      remoteConfig = MockRemoteConfig();
      firebaseRemoteConfigClient = FirebaseRemoteConfigClient(
        remoteConfig: remoteConfig,
      );

      registerFallbackValue(FakeRemoteConfigSettings());
    });

    test('can be instantiated', () {
      expect(FirebaseRemoteConfigClient(remoteConfig: remoteConfig), isNotNull);
    });

    test('creates RemoteConfig instance internally when not injected', () {
      expect(FirebaseRemoteConfigClient.new, returnsNormally);
    });

    group('initialize', () {
      test('throws AssertionError if already initialized', () async {
        when(() => remoteConfig.setConfigSettings(any()))
            .thenAnswer((_) => Future.value());
        when(remoteConfig.fetchAndActivate)
            .thenAnswer((_) => Future.value(true));
        await firebaseRemoteConfigClient.initialize();

        await expectLater(
          firebaseRemoteConfigClient.initialize(),
          throwsAssertionError,
        );
      });

      test('does nothing if errors thrown from RemoteConfig', () async {
        when(() => remoteConfig.setConfigSettings(any()))
            .thenThrow(Exception.new);

        await firebaseRemoteConfigClient.initialize();

        verify(() => remoteConfig.setConfigSettings(any())).called(1);
        verifyNever(remoteConfig.fetchAndActivate);
      });

      test('returns successfully if no errors thrown from RemoteConfig',
          () async {
        when(() => remoteConfig.setConfigSettings(any()))
            .thenAnswer((_) => Future.value());
        when(remoteConfig.fetchAndActivate)
            .thenAnswer((_) => Future.value(true));

        await expectLater(
          () => firebaseRemoteConfigClient.initialize(),
          returnsNormally,
        );

        verify(() => remoteConfig.setConfigSettings(any())).called(1);
        verify(remoteConfig.fetchAndActivate).called(1);
      });
    });

    group('getInt', () {
      test('returns 123 when the correct key provided', () async {
        const key = 'correct_key';
        when(() => remoteConfig.getInt(key)).thenAnswer((_) => 123);
        when(() => remoteConfig.setConfigSettings(any()))
            .thenAnswer((_) => Future.value());
        when(remoteConfig.fetchAndActivate)
            .thenAnswer((_) => Future.value(true));
        await firebaseRemoteConfigClient.initialize();

        expect(
          firebaseRemoteConfigClient.getInt(key),
          123,
        );

        verify(() => remoteConfig.getInt(key)).called(1);
      });

      test('throws AssertionError if the client was not initialized', () async {
        await expectLater(
          () => firebaseRemoteConfigClient.getInt('123'),
          throwsAssertionError,
        );
      });

      test('throws GetDataFailure when error thrown from RemoteConfig',
          () async {
        const key = 'key';
        when(() => remoteConfig.getInt(any())).thenThrow(Exception());
        when(() => remoteConfig.setConfigSettings(any()))
            .thenAnswer((_) => Future.value());
        when(remoteConfig.fetchAndActivate)
            .thenAnswer((_) => Future.value(true));
        await firebaseRemoteConfigClient.initialize();

        expect(
          () => firebaseRemoteConfigClient.getInt(key),
          throwsA(isA<GetDataFailure>()),
        );

        verify(() => remoteConfig.getInt(key)).called(1);
      });
    });

    group('getBool', () {
      test('returns true when the correct key provided', () async {
        const key = 'correct_key';
        when(() => remoteConfig.getBool(key)).thenAnswer((_) => true);
        when(() => remoteConfig.setConfigSettings(any()))
            .thenAnswer((_) => Future.value());
        when(remoteConfig.fetchAndActivate)
            .thenAnswer((_) => Future.value(true));
        await firebaseRemoteConfigClient.initialize();

        expect(
          firebaseRemoteConfigClient.getBool(key),
          true,
        );

        verify(() => remoteConfig.getBool(key)).called(1);
      });

      test('throws AssertionError if the client was not initialized', () async {
        await expectLater(
          () => firebaseRemoteConfigClient.getBool('123'),
          throwsAssertionError,
        );
      });

      test('throws GetDataFailure when error thrown from RemoteConfig',
          () async {
        const key = 'key';
        when(() => remoteConfig.getBool(any())).thenThrow(Exception());
        when(() => remoteConfig.setConfigSettings(any()))
            .thenAnswer((_) => Future.value());
        when(remoteConfig.fetchAndActivate)
            .thenAnswer((_) => Future.value(true));
        await firebaseRemoteConfigClient.initialize();

        expect(
          () => firebaseRemoteConfigClient.getBool(key),
          throwsA(isA<GetDataFailure>()),
        );

        verify(() => remoteConfig.getBool(key)).called(1);
      });
    });

    group('getString', () {
      test('returns true when the correct key provided', () async {
        const key = 'correct_key';
        when(() => remoteConfig.getString(key)).thenAnswer((_) => 'a string');
        when(() => remoteConfig.setConfigSettings(any()))
            .thenAnswer((_) => Future.value());
        when(remoteConfig.fetchAndActivate)
            .thenAnswer((_) => Future.value(true));
        await firebaseRemoteConfigClient.initialize();

        expect(
          firebaseRemoteConfigClient.getString(key),
          isA<String>(),
        );

        verify(() => remoteConfig.getString(key)).called(1);
      });

      test('throws AssertionError if the client was not initialized', () async {
        await expectLater(
          () => firebaseRemoteConfigClient.getString('123'),
          throwsAssertionError,
        );
      });

      test('throws GetDataFailure when error thrown from RemoteConfig',
          () async {
        const key = 'key';
        when(() => remoteConfig.getString(any())).thenThrow(Exception());
        when(() => remoteConfig.setConfigSettings(any()))
            .thenAnswer((_) => Future.value());
        when(remoteConfig.fetchAndActivate)
            .thenAnswer((_) => Future.value(true));
        await firebaseRemoteConfigClient.initialize();

        expect(
          () => firebaseRemoteConfigClient.getString(key),
          throwsA(isA<GetDataFailure>()),
        );

        verify(() => remoteConfig.getString(key)).called(1);
      });
    });
  });
}
