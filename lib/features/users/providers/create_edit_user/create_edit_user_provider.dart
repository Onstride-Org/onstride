import 'package:auth_repository/auth_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/config/config.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:users_repository/users_repository.dart';

part 'create_edit_user_provider.freezed.dart';

part 'create_edit_user_provider.g.dart';

part 'create_edit_user_state.dart';

@riverpod
class CreateEditUser extends _$CreateEditUser {
  UsersRepository get _usersRepository => ref.read(usersRepositoryProvider);

  Future<void> create(String ownerId, CreateAccountRequest request) async {
    try {
      state = const CreateEditUserState.loading();
      final user = await _usersRepository.createUserForOwner(
        ownerId: ownerId,
        request: request,
      );
      state = CreateEditUserState.success(user: user);
    } on AuthenticationException catch (e) {
      state = CreateEditUserState.authError(exception: e);
    } on DataProviderException catch (e) {
      state = CreateEditUserState.dataError(exception: e);
    }
  }

  Future<void> edit(GLUser user, EditUserRequest request) async {
    try {
      state = const CreateEditUserState.loading();
      final res = await _usersRepository.editUser(
        user: user,
        request: request,
      );
      state = CreateEditUserState.success(user: res);
    } on AuthenticationException catch (e) {
      state = CreateEditUserState.authError(exception: e);
    } on DataProviderException catch (e) {
      state = CreateEditUserState.dataError(exception: e);
    }
  }

  @override
  CreateEditUserState build() => const CreateEditUserState.initial();
}
