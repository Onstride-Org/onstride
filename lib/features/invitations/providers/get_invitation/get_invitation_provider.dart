// get_invitation_provider.dart
import 'package:auth_repository/auth_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/config/config.dart';
import 'package:invitations_repository/invitations_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'get_invitation_provider.freezed.dart';
part 'get_invitation_provider.g.dart';
part 'get_invitation_state.dart';

@riverpod
class GetInvitation extends _$GetInvitation {
  InvitationsRepository get _invitationsRepository =>
      ref.read(invitationsRepositoryProvider);

  /// Fetches an invitation by id and updates the state accordingly.
  ///
  /// States:
  /// - loading: while the request is in progress
  /// - success: when the invitation is found
  /// - notFound: when the invitation does not exist (null from repository)
  /// - authError: when an AuthenticationException is thrown
  /// - dataError: when a DataProviderException is thrown
  Future<void> getById(String id) async {
    try {
      state = const GetInvitationState.loading();
      final invitation = await _invitationsRepository.getInvitationById(
        id: id,
      );

      if (invitation == null) {
        state = const GetInvitationState.notFound();
        return;
      }

      state = GetInvitationState.success(invitation: invitation);
    } on AuthenticationException catch (e) {
      state = GetInvitationState.authError(exception: e);
    } on DataProviderException catch (e) {
      state = GetInvitationState.dataError(exception: e);
    }
  }

  @override
  GetInvitationState build() => const GetInvitationState.initial();
}
