import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:users_repository/users_repository.dart';

part 'delete_stable_owner_provider.freezed.dart';
part 'delete_stable_owner_provider.g.dart';

@freezed
sealed class DeleteStableOwnerState with _$DeleteStableOwnerState {
  const factory DeleteStableOwnerState.initial() = _Initial;
  const factory DeleteStableOwnerState.loading() = _Loading;
  const factory DeleteStableOwnerState.success() = _Success;
  const factory DeleteStableOwnerState.error(String message) = _Error;
}

@riverpod
class DeleteStableOwner extends _$DeleteStableOwner {
  UsersRepository get _usersRepository => ref.read(usersRepositoryProvider);

  @override
  DeleteStableOwnerState build() => const DeleteStableOwnerState.initial();

  Future<void> deleteStableOwner({
    required GLUser owner,
    required String reason,
  }) async {
    try {
      state = const DeleteStableOwnerState.loading();

      final deletedBy = ref.read(accountProvider).currentUser.id;

      await _usersRepository.softDeleteStableOwner(
        ownerId: owner.id,
        deletedBy: deletedBy,
        reason: reason,
      );

      state = const DeleteStableOwnerState.success();
    } on DataProviderException catch (e) {
      state = DeleteStableOwnerState.error(e.toString());
    } on Exception catch (e) {
      state = DeleteStableOwnerState.error(e.toString());
    }
  }
}
