import 'package:account_repository/account_repository.dart';
import 'package:auth_repository/auth_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/profile/providers/delete_account_prevention_reason.dart';
import 'package:gl_horses/features/profile/providers/delete_account_validation_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'delete_account_provider.freezed.dart';
part 'delete_account_provider.g.dart';
part 'delete_account_state.dart';

@riverpod
class DeleteAccount extends _$DeleteAccount {
  AccountRepository get _accountRepository =>
      ref.read(accountRepositoryProvider);
  AuthRepository get _authRepository => ref.read(authRepositoryProvider);

  Future<void> deleteAccount({
    required String reason,
    required String registrationMethod,
    required String password,
  }) async {
    try {
      state = const DeleteAccountState.loading();

      final currentUser = ref.read(accountProvider).currentUser;

      // 1. Confirm account deletion by requesting password re-authentication
      final validationResult = await ref
          .read(deleteAccountValidationProvider.notifier)
          .validateAccountDeletion(
            user: currentUser,
            password: password,
          );

      if (validationResult is PreventedDeleteAccountValidationResult) {
        state = DeleteAccountState.prevented(
          reason: validationResult.reason,
        );
        return;
      }

      if (validationResult is ErrorDeleteAccountValidationResult) {
        if (validationResult.reason ==
            DeleteAccountPreventionReason.authenticationFailed) {
          state = const DeleteAccountState.authenticationError();
        } else {
          state = const DeleteAccountState.error(
            exception: UnknownDataProviderException(),
          );
        }
        return;
      }

      // 2. Anonymize user data in database
      await _accountRepository.deleteAccount(
        user: currentUser,
        reason: reason,
      );

      // 3. Delete Firebase Auth account
      await _authRepository.deleteAccount(
        registrationMethod: registrationMethod,
      );

      // 4. Clear local data
      await ref.read(databaseClientProvider).clear();

      // 6. Navigate to login screen
      state = const DeleteAccountState.success();
    } on AuthenticationException {
      state = const DeleteAccountState.error(
        exception: UnknownDataProviderException(),
      );
    } on DataProviderException catch (e) {
      state = DeleteAccountState.error(exception: e);
    } catch (e) {
      state = const DeleteAccountState.error(
        exception: UnknownDataProviderException(),
      );
    }
  }

  @override
  DeleteAccountState build() => const DeleteAccountState.initial();
}
