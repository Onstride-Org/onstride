import 'package:account_repository/account_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'update_profile_provider.freezed.dart';
part 'update_profile_provider.g.dart';
part 'update_profile_state.dart';

@riverpod
class UpdateProfile extends _$UpdateProfile {
  AccountRepository get _accountRepository =>
      ref.read(accountRepositoryProvider);

  Future<void> updateProfile({
    required String name,
    required String phoneNumber,
  }) async {
    try {
      state = const UpdateProfileState.loading();

      final currentUser = ref.read(accountProvider).currentUser;
      final updatedUser = currentUser.copyWith(
        name: name,
        phoneNumber: phoneNumber,
      );

      await _accountRepository.updateAccount(user: updatedUser);
      ref.read(accountProvider.notifier).setUser(updatedUser);
      state = const UpdateProfileState.success();
    } on DataProviderException catch (e) {
      state = UpdateProfileState.error(exception: e);
    } catch (e) {
      state = const UpdateProfileState.error(
        exception: UnknownDataProviderException(),
      );
    }
  }

  @override
  UpdateProfileState build() => const UpdateProfileState.initial();
}
