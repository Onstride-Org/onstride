import 'package:account_repository/account_repository.dart';
import 'package:auth_repository/auth_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'complete_account_provider.freezed.dart';

part 'complete_account_provider.g.dart';

part 'complete_account_state.dart';

@riverpod
class CompleteAccount extends _$CompleteAccount {
  AccountRepository get _accountRepository =>
      ref.read(accountRepositoryProvider);

  AuthRepository get _authRepository => ref.read(authRepositoryProvider);

  Future<void> submit({required GLUser user, required String password}) async {
    state = const CompleteAccountState.loading();
    try {
      await _authRepository.updateUser(name: user.name!, password: password);
      await _accountRepository.updateAccount(user: user);
      ref.read(accountProvider.notifier).setUser(user);
      state = SuccessCompleteAccountState(user: user);
    } on DataProviderException catch (e) {
      state = ErrorCompleteAccountState(exception: e);
    } on AuthenticationException catch (e) {
      state = const ErrorCompleteAccountState(
        exception: UnknownDataProviderException(),
      );
    }
  }

  @override
  CompleteAccountState build() => const CompleteAccountState.initial();
}
