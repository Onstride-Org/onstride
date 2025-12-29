import 'package:account_repository/account_repository.dart';
import 'package:auth_repository/auth_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/auth/auth.dart';
import 'package:mocktail/mocktail.dart';
import 'package:models/models.dart';
import 'package:riverpod/riverpod.dart';

// Mocks
class MockAuthRepository extends Mock implements AuthRepository {}

class MockAccountRepository extends Mock implements AccountRepository {}

/// Utility to record provider states
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
  setUpAll(() {
    // Register fallback values for mocktail
    registerFallbackValue(
      const CreateAccountRequest(
        email: 'fallback@example.com',
        password: 'Secret123!',
        name: 'Cosme Fulanito',
        phoneNumber: '+14455546565',
        accountType: AccountType.manager,
        barnId: null,
      ),
    );
  });

  late MockAuthRepository auth;
  late MockAccountRepository accounts;
  late ProviderContainer container;

  setUp(() {
    auth = MockAuthRepository();
    accounts = MockAccountRepository();
    container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(auth),
        accountRepositoryProvider.overrideWithValue(accounts),
      ],
    );
  });

  tearDown(() => container.dispose());

  group('CreateAccountProvider', () {
    test(
      'emits [initial, loading, success] when account is created successfully',
      () async {
        const uid = 'uid_123';
        const request = CreateAccountRequest(
          email: 'john@doe.com',
          password: 'SuperSecret123!',
          name: 'John Doe',
          phoneNumber: '+1234567890',
          accountType: AccountType.manager,
          barnId: null,
        );
        final user = GLUser(
          id: uid,
          email: request.email,
          name: request.name,
          phoneNumber: request.phoneNumber,
          accountType: request.accountType,
          barnId: request.barnId,
        );

        when(
          () => auth.signUp(email: request.email, password: request.password),
        ).thenAnswer((_) async => uid);
        when(
          () => accounts.registerUserInDatabase(id: uid, request: request),
        ).thenAnswer((_) async => user);

        final states = recordStates<CreateAccountState>(
          container,
          createAccountProvider,
        );

        await container
            .read(createAccountProvider.notifier)
            .submit(request: request);

        expect(states[0], const CreateAccountState.initial());
        expect(states[1], const CreateAccountState.loading());
        final last = states.last;
        expect(
          last,
          isA<SuccessCreateAccountState>()
              .having((s) => s.user.id, 'user.id', uid)
              .having((s) => s.user.email, 'user.email', request.email),
        );

        verify(
          () => auth.signUp(email: request.email, password: request.password),
        ).called(1);
        verify(
          () => accounts.registerUserInDatabase(id: uid, request: request),
        ).called(1);
      },
    );

    test(
      'emits [initial, loading, error(SignUpFailure)] when signUp returns null',
      () async {
        const request = CreateAccountRequest(
          email: 'null@case.com',
          password: 'xYz123456',
          name: 'Null User',
          phoneNumber: '+1000000000',
          accountType: AccountType.manager,
          barnId: null,
        );

        when(
          () => auth.signUp(email: request.email, password: request.password),
        ).thenAnswer((_) async => null);

        final states = recordStates<CreateAccountState>(
          container,
          createAccountProvider,
        );

        await container
            .read(createAccountProvider.notifier)
            .submit(request: request);

        expect(states[0], const CreateAccountState.initial());
        expect(states[1], const CreateAccountState.loading());
        expect(
          states.last,
          isA<ErrorCreateAccountState>().having(
            (e) => e.exception,
            'exception',
            isA<SignUpFailure>(),
          ),
        );

        verify(
          () => auth.signUp(email: request.email, password: request.password),
        ).called(1);
        verifyNever(
          () => accounts.registerUserInDatabase(
            id: any(named: 'id'),
            request: any(named: 'request'),
          ),
        );
      },
    );

    test(
      'emits [initial, loading, error(AuthenticationException)] when signUp throws AuthenticationException',
      () async {
        const request = CreateAccountRequest(
          email: 'bad@creds.com',
          password: 'wrongPass',
          name: 'Bad Creds',
          phoneNumber: '+1999999999',
          accountType: AccountType.manager,
          barnId: null,
        );

        final authError = SignUpEmailInUseFailure(null, null);
        when(
          () => auth.signUp(email: request.email, password: request.password),
        ).thenThrow(authError);

        final states = recordStates<CreateAccountState>(
          container,
          createAccountProvider,
        );

        await container
            .read(createAccountProvider.notifier)
            .submit(request: request);

        expect(states[0], const CreateAccountState.initial());
        expect(states[1], const CreateAccountState.loading());
        expect(
          states.last,
          isA<ErrorCreateAccountState>().having(
            (e) => e.exception,
            'exception',
            authError,
          ),
        );

        verify(
          () => auth.signUp(email: request.email, password: request.password),
        ).called(1);
        verifyNever(
          () => accounts.registerUserInDatabase(
            id: any(named: 'id'),
            request: any(named: 'request'),
          ),
        );
      },
    );

    test(
      'emits [initial, loading, error(AuthUnknownException)] when an unknown Exception occurs',
      () async {
        const request = CreateAccountRequest(
          email: 'oops@unknown.com',
          password: 'Secret123!',
          name: 'Unknown User',
          phoneNumber: '+1888888888',
          accountType: AccountType.manager,
          barnId: null,
        );

        when(
          () => auth.signUp(email: request.email, password: request.password),
        ).thenThrow(Exception('network down'));

        final states = recordStates<CreateAccountState>(
          container,
          createAccountProvider,
        );

        await container
            .read(createAccountProvider.notifier)
            .submit(request: request);

        expect(states[0], const CreateAccountState.initial());
        expect(states[1], const CreateAccountState.loading());
        expect(
          states.last,
          isA<ErrorCreateAccountState>().having(
            (e) => e.exception,
            'exception',
            isA<AuthUnknownException>(),
          ),
        );
      },
    );
  });
}
