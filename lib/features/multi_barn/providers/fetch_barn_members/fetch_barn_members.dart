import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/multi_barn/providers/fetch_barn_members/fetch_barn_members_state.dart';
import 'package:models/models.dart';
import 'package:multi_barn_repository/multi_barn_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fetch_barn_members.g.dart';

@riverpod
class FetchBarnMembers extends _$FetchBarnMembers {
  MultiBarnRepository get _repo => ref.read(multiBarnRepositoryProvider);

  @override
  FetchBarnMembersState build() => const FetchBarnMembersState.initial();

  Future<void> fetch({required String barnId}) async {
    try {
      state = const FetchBarnMembersState.loading();
      final members = await _repo.getBarnMembers(barnId: barnId);
      state = FetchBarnMembersState.success(members: members);
    } catch (e) {
      state = FetchBarnMembersState.error(message: e.toString());
    }
  }

  Future<void> addMember(AddUserToBarnPayload payload) async {
    try {
      final newMember = await _repo.addUserToBarn(payload);
      if (state is SuccessFetchBarnMembersState) {
        final currentState = state as SuccessFetchBarnMembersState;
        state = FetchBarnMembersState.success(
          members: [...currentState.members, newMember],
        );
      }
    } catch (e) {
      state = FetchBarnMembersState.error(message: e.toString());
    }
  }

  Future<void> updateMemberRole(UpdateBarnRolePayload payload) async {
    try {
      final updated = await _repo.updateBarnRole(payload);
      if (state is SuccessFetchBarnMembersState) {
        final currentState = state as SuccessFetchBarnMembersState;
        final updatedMembers = currentState.members
            .map((m) => m.id == updated.id ? updated : m)
            .toList();
        state = FetchBarnMembersState.success(members: updatedMembers);
      }
    } catch (e) {
      state = FetchBarnMembersState.error(message: e.toString());
    }
  }

  Future<void> removeMember({
    required String userId,
    required String barnId,
    required String removedBy,
  }) async {
    try {
      await _repo.removeUserFromBarn(
        userId: userId,
        barnId: barnId,
        removedBy: removedBy,
      );
      if (state is SuccessFetchBarnMembersState) {
        final currentState = state as SuccessFetchBarnMembersState;
        final updatedMembers = currentState.members
            .where((m) => m.userId != userId)
            .toList();
        state = FetchBarnMembersState.success(members: updatedMembers);
      }
    } catch (e) {
      state = FetchBarnMembersState.error(message: e.toString());
    }
  }
}
