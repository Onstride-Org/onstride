import 'package:auth_repository/auth_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:users_repository/users_repository.dart';

part 'delete_user_provider.freezed.dart';
part 'delete_user_provider.g.dart';
part 'delete_user_state.dart';

@riverpod
class DeleteUser extends _$DeleteUser {
  UsersRepository get _usersRepository => ref.read(usersRepositoryProvider);

  Future<void> delete(GLUser user) async {
    try {
      state = const DeleteUserState.loading();
      final deletedBy = ref.read(accountProvider).currentUser.id;
      final barnId = ref.read(accountProvider).currentBarn?.id;
      if (barnId == null) {
        state = const DeleteUserState.dataError(
          exception: NotFoundBarnException(),
        );
        return;
      }
      await _usersRepository.deleteUser(
        user: user,
        deletedBy: deletedBy,
        barnId: barnId,
      );
      state = DeleteUserState.success(user: user);
    } on AuthenticationException catch (e) {
      state = DeleteUserState.authError(exception: e);
    } on DataProviderException catch (e) {
      state = DeleteUserState.dataError(exception: e);
    }
  }

  @override
  DeleteUserState build() => const DeleteUserState.initial();
}
