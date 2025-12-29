import 'dart:developer';

import 'package:account_repository/account_repository.dart';
import 'package:auth_repository/auth_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'create_account_provider.freezed.dart';
part 'create_account_provider.g.dart';
part 'create_account_state.dart';

@riverpod
class CreateAccount extends _$CreateAccount {
  AccountRepository get _accountRepository =>
      ref.read(accountRepositoryProvider);

  AuthRepository get _authRepository => ref.read(authRepositoryProvider);

  Future<void> submit({required CreateAccountRequest request}) async {
    state = const CreateAccountState.loading();
    try {
      final res = await _authRepository.signUp(
        email: request.email,
        password: request.password!,
      );
      if (res != null) {
        final user = await _accountRepository.registerUserInDatabase(
          id: res,
          request: request,
        );
        ref.read(accountProvider.notifier).setUser(user);
        try {
          await ref
              .read(pushNotificationsServiceProvider)
              .saveFCMCurrentToken();
        } catch (e, s) {
          log(
            'Error when save fcm token for a new user',
            error: e,
            stackTrace: s,
          );
        }

        state = SuccessCreateAccountState(user: user);
      } else {
        state = ErrorCreateAccountState(exception: SignUpFailure(null, null));
      }
    } on SignUpConnectionFailure catch (e) {
      state = ErrorCreateAccountState(exception: e);
    } on AuthenticationException catch (e) {
      state = ErrorCreateAccountState(exception: e);
    } on NotNetworkAccessException catch (e, s) {
      state = ErrorCreateAccountState(
        exception: SignUpConnectionFailure(e, s),
      );
    } on Exception catch (e, s) {
      state = ErrorCreateAccountState(
        exception: AuthUnknownException(e, s, '$e - $s'),
      );
    }
  }

  @override
  CreateAccountState build() => const CreateAccountState.initial();
}
