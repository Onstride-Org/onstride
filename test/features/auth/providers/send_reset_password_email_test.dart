import 'package:auth_repository/auth_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/auth/auth.dart';
import 'package:mocktail/mocktail.dart';
import 'package:riverpod/riverpod.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

List<T> recordStates<T>(
  ProviderContainer container,
  ProviderListenable<T> provider, {
  bool fireImmediately = true,
}) {
  final recorded = <T>[];
  container.listen<T>(
    provider,
    (prev, next) => recorded.add(next),
    fireImmediately: fireImmediately,
  );
  return recorded;
}

void main() {
  late MockAuthRepository auth;
  late ProviderContainer container;

  setUp(() {
    auth = MockAuthRepository();
    container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(auth),
      ],
    );
  });

  tearDown(() => container.dispose());

  group('ResetPassword Provider', () {
    test('emits [initial, loading, success] on successful reset', () async {
      const email = 'john@doe.com';

      when(
        () => auth.sendPasswordResetEmail(email: email),
      ).thenAnswer((_) async {});

      final states = recordStates<ResetPasswordState>(
        container,
        resetPasswordProvider,
      );

      await container
          .read(resetPasswordProvider.notifier)
          .sendResetEmail(email);

      expect(states[0], const ResetPasswordState.initial());
      expect(states[1], const ResetPasswordState.loading());
      expect(states.last, const ResetPasswordState.success());

      verify(() => auth.sendPasswordResetEmail(email: email)).called(1);
      verifyNoMoreInteractions(auth);
    });

    test(
      'emits [initial, loading, error(AuthenticationException)] when repo throws AuthenticationException',
      () async {
        const email = 'bad@creds.com';
        final authError = ResetPasswordInvalidEmailFailure(null, null);

        when(
          () => auth.sendPasswordResetEmail(email: email),
        ).thenThrow(authError);

        final states = recordStates<ResetPasswordState>(
          container,
          resetPasswordProvider,
        );

        await container
            .read(resetPasswordProvider.notifier)
            .sendResetEmail(email);

        expect(states[0], const ResetPasswordState.initial());
        expect(states[1], const ResetPasswordState.loading());
        expect(
          states.last,
          isA<ErrorResetPasswordState>().having(
            (e) => e.exception,
            'exception',
            authError,
          ),
        );

        verify(() => auth.sendPasswordResetEmail(email: email)).called(1);
        verifyNoMoreInteractions(auth);
      },
    );

    test(
      'emits [initial, loading, error(AuthUnknownException)] when an unknown Exception occurs',
      () async {
        const email = 'oops@unknown.com';

        when(
          () => auth.sendPasswordResetEmail(email: email),
        ).thenThrow(Exception('network down'));

        final states = recordStates<ResetPasswordState>(
          container,
          resetPasswordProvider,
        );

        await container
            .read(resetPasswordProvider.notifier)
            .sendResetEmail(email);

        expect(states[0], const ResetPasswordState.initial());
        expect(states[1], const ResetPasswordState.loading());
        expect(
          states.last,
          isA<ErrorResetPasswordState>().having(
            (e) => e.exception,
            'exception',
            isA<AuthUnknownException>(),
          ),
        );

        verify(() => auth.sendPasswordResetEmail(email: email)).called(1);
        verifyNoMoreInteractions(auth);
      },
    );
  });
}
