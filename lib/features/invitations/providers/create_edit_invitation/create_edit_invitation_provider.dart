import 'package:auth_repository/auth_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/config/config.dart';
import 'package:invitations_repository/invitations_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'create_edit_invitation_provider.freezed.dart';
part 'create_edit_invitation_provider.g.dart';
part 'create_edit_invitation_state.dart';

@riverpod
class CreateEditInvitation extends _$CreateEditInvitation {
  InvitationsRepository get _invitationsRepository =>
      ref.read(invitationsRepositoryProvider);

  Future<void> create(InvitationRequest request) async {
    try {
      state = const CreateEditInvitationState.loading();
      final invitation = await _invitationsRepository.createInvitation(
        request: request,
      );
      state = CreateEditInvitationState.success(invitation: invitation);
    } on AuthenticationException catch (e) {
      state = CreateEditInvitationState.authError(exception: e);
    } on DataProviderException catch (e) {
      state = CreateEditInvitationState.dataError(exception: e);
    }
  }

  Future<void> edit(Invitation invitation) async {
    try {
      state = const CreateEditInvitationState.loading();
      final res = await _invitationsRepository.updateInvitation(
        invitation: invitation,
      );
      state = CreateEditInvitationState.success(invitation: res);
    } on AuthenticationException catch (e) {
      state = CreateEditInvitationState.authError(exception: e);
    } on DataProviderException catch (e) {
      state = CreateEditInvitationState.dataError(exception: e);
    }
  }

  Future<void> deactivateInvitation(Invitation invitation) async {
    try {
      state = const CreateEditInvitationState.loading();
      final res = await _invitationsRepository.deactivateInvitation(
        invitation: invitation,
      );
      state = CreateEditInvitationState.success(invitation: res);
    } on AuthenticationException catch (e) {
      state = CreateEditInvitationState.authError(exception: e);
    } on DataProviderException catch (e) {
      state = CreateEditInvitationState.dataError(exception: e);
    }
  }

  @override
  CreateEditInvitationState build() =>
      const CreateEditInvitationState.initial();
}
