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

  group('Login Provider', () {
    test('emits [initial, loading, success] on successful login', () async {
      const email = 'john@doe.com';
      const password = 'SuperSecret123!';

      when(
        () => auth.logInWithEmailAndPassword(email: email, password: password),
      ).thenAnswer((_) async {});

      final states = recordStates<LoginState>(container, loginProvider);

      await container
          .read(loginProvider.notifier)
          .login(
            email: email,
            password: password,
          );

      expect(states[0], const LoginState.initial());
      expect(states[1], const LoginState.loading());
      expect(states.last, const LoginState.success());

      verify(
        () => auth.logInWithEmailAndPassword(email: email, password: password),
      ).called(1);
      verifyNoMoreInteractions(auth);
    });

    test(
      'emits [initial, loading, error(AuthenticationException)] when repo throws AuthenticationException',
      () async {
        const email = 'bad@creds.com';
        const password = 'wrong';
        final authError = LogInConnectionFailure(null, null);

        when(
          () =>
              auth.logInWithEmailAndPassword(email: email, password: password),
        ).thenThrow(authError);

        final states = recordStates<LoginState>(container, loginProvider);

        await container
            .read(loginProvider.notifier)
            .login(
              email: email,
              password: password,
            );

        expect(states[0], const LoginState.initial());
        expect(states[1], const LoginState.loading());
        expect(
          states.last,
          isA<ErrorLoginState>().having(
            (e) => e.exception,
            'exception',
            authError,
          ),
        );

        verify(
          () =>
              auth.logInWithEmailAndPassword(email: email, password: password),
        ).called(1);
        verifyNoMoreInteractions(auth);
      },
    );

    test(
      'emits [initial, loading, error(AuthUnknownException)] when an unknown Exception occurs',
      () async {
        const email = 'oops@unknown.com';
        const password = 'Secret123!';

        when(
          () =>
              auth.logInWithEmailAndPassword(email: email, password: password),
        ).thenThrow(Exception('network down'));

        final states = recordStates<LoginState>(container, loginProvider);

        await container
            .read(loginProvider.notifier)
            .login(
              email: email,
              password: password,
            );

        expect(states[0], const LoginState.initial());
        expect(states[1], const LoginState.loading());
        expect(
          states.last,
          isA<ErrorLoginState>().having(
            (e) => e.exception,
            'exception',
            isA<AuthUnknownException>(),
          ),
        );

        verify(
          () =>
              auth.logInWithEmailAndPassword(email: email, password: password),
        ).called(1);
        verifyNoMoreInteractions(auth);
      },
    );

    test('reset() brings state back to initial', () async {
      const email = 'john@doe.com';
      const password = 'SuperSecret123!';

      when(
        () => auth.logInWithEmailAndPassword(email: email, password: password),
      ).thenAnswer((_) async {});

      final states = recordStates<LoginState>(container, loginProvider);

      // Move to success first
      await container
          .read(loginProvider.notifier)
          .login(
            email: email,
            password: password,
          );
      // Then reset
      container.read(loginProvider.notifier).reset();

      // Last state must be initial
      expect(states.last, const LoginState.initial());
    });
  });
}
