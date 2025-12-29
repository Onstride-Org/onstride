import 'package:account_repository/account_repository.dart';
import 'package:barns_repository/barns_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gl_horses/core/config/config.dart';
import 'package:gl_horses/core/providers/account/account_provider.dart';
import 'package:mocktail/mocktail.dart';
import 'package:models/models.dart';
import 'package:riverpod/riverpod.dart';

import '../../../utils/fixtures.dart';

class MockAccountRepository extends Mock implements AccountRepository {}

class MockBarnsRepository extends Mock implements BarnsRepository {}

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
    registerFallbackValue(const UnknownDataProviderException());
  });

  late MockAccountRepository accounts;
  late MockBarnsRepository barns;
  late ProviderContainer container;

  setUp(() {
    accounts = MockAccountRepository();
    barns = MockBarnsRepository();

    container = ProviderContainer(
      overrides: [
        accountRepositoryProvider.overrideWithValue(accounts),
        barnsRepositoryProvider.overrideWithValue(barns),
      ],
    );
  });

  tearDown(() => container.dispose());

  group('AccountState extensions', () {
    test(
      'currentUser is anonymous and currentBarn is null on non-success states',
      () {
        expect(const AccountState.initial().currentUser, GLUser.anonymous);
        expect(const AccountState.initial().currentBarn, isNull);

        expect(const AccountState.loading().currentUser, GLUser.anonymous);
        expect(const AccountState.loading().currentBarn, isNull);

        final e = UnknownDataProviderException();
        expect(AccountState.error(exception: e).currentUser, GLUser.anonymous);
        expect(AccountState.error(exception: e).currentBarn, isNull);
      },
    );

    test('currentUser/currentBarn reflect success payload', () {
      final user = makeNonOwnerUser();
      final barn = makeBarn();

      final s = AccountState.success(user: user, userBarn: barn);
      expect(s.currentUser.id, user.id);
      expect(s.currentBarn?.id, barn.id);
    });
  });

  group('Account provider - setUser & setBarn', () {
    test('setUser moves to success with given user', () {
      final states = recordStates<AccountState>(container, accountProvider);

      final user = makeNonOwnerUser(id: 'u42');
      container.read(accountProvider.notifier).setUser(user);

      expect(states.first, const AccountState.initial());
      final last = states.last;
      expect(last, isA<SuccessAccountState>());
      expect((last as SuccessAccountState).user.id, 'u42');
      expect(last.userBarn, isNull);
    });

    test('setBarn updates barn only when state is success', () {
      final states = recordStates<AccountState>(container, accountProvider);

      // Calling setBarn on initial should have no effect
      container.read(accountProvider.notifier).setBarn(makeBarn(id: 'b0'));
      expect(states.last, const AccountState.initial());

      // Move to success with a user
      final user = makeNonOwnerUser(id: 'u1');
      container.read(accountProvider.notifier).setUser(user);

      // Now set the barn
      final barn = makeBarn(id: 'b1');
      container.read(accountProvider.notifier).setBarn(barn);

      final last = states.last as SuccessAccountState;
      expect(last.user.id, 'u1');
      expect(last.userBarn?.id, 'b1');
    });
  });

  group('Account provider - loadUser', () {
    test(
      'non-owner: emits [initial, loading, success] and does not query barns',
      () async {
        final states = recordStates<AccountState>(container, accountProvider);

        final user = makeNonOwnerUser(id: 'u1');

        when(() => accounts.fetchUser(id: 'u1')).thenAnswer((_) async => user);

        await container.read(accountProvider.notifier).loadUser('u1');

        expect(states[0], const AccountState.initial());
        expect(states[1], const AccountState.loading());
        final last = states.last as SuccessAccountState;
        expect(last.user.id, 'u1');
        expect(last.userBarn, isNull);

        verify(() => accounts.fetchUser(id: 'u1')).called(1);
        verifyNever(() => barns.getBarnById(barnId: any(named: 'ownerId')));
      },
    );

    test('owner with barn found: sets fetched barn', () async {
      final states = recordStates<AccountState>(container, accountProvider);

      final owner = makeOwnerUser(id: 'owner-1');
      final barn = makeBarn(id: 'barn-1');

      when(
        () => accounts.fetchUser(id: 'owner-1'),
      ).thenAnswer((_) async => owner);
      when(
        () => barns.getBarnById(barnId: 'owner-1'),
      ).thenAnswer((_) async => barn);

      await container.read(accountProvider.notifier).loadUser('owner-1');

      final last = states.last as SuccessAccountState;
      expect(last.user.id, 'owner-1');
      expect(last.userBarn?.id, 'barn-1');

      verify(() => accounts.fetchUser(id: 'owner-1')).called(1);
      verify(() => barns.getBarnById(barnId: 'owner-1')).called(1);
    });

    test('owner with no barn: keeps barn as null', () async {
      final states = recordStates<AccountState>(container, accountProvider);

      final owner = makeOwnerUser(id: 'owner-2');

      when(
        () => accounts.fetchUser(id: 'owner-2'),
      ).thenAnswer((_) async => owner);
      when(
        () => barns.getBarnById(barnId: 'owner-2'),
      ).thenAnswer((_) async => null);

      await container.read(accountProvider.notifier).loadUser('owner-2');

      final last = states.last as SuccessAccountState;
      expect(last.user.id, 'owner-2');
      expect(last.userBarn, isNull);

      verify(() => accounts.fetchUser(id: 'owner-2')).called(1);
      verify(() => barns.getBarnById(barnId: 'owner-2')).called(1);
    });

    test(
      'error path: emits error when repository throws DataProviderException',
      () async {
        final states = recordStates<AccountState>(container, accountProvider);

        final dpe = UnknownDataProviderException();
        when(() => accounts.fetchUser(id: 'boom')).thenThrow(dpe);

        await container.read(accountProvider.notifier).loadUser('boom');

        final last = states.last as ErrorAccountState;
        expect(last.exception, same(dpe));
      },
    );
  });
}
