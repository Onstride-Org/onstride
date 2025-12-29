import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';

class InvitationsRepository {
  InvitationsRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  /// Creates a new invitation for a barn based on the given request.
  ///
  /// The underlying data provider should handle:
  /// - generating the invitation id
  /// - setting createdAt / expiresAt
  /// - marking the invitation as active
  Future<Invitation> createInvitation({
    required InvitationRequest request,
  }) async {
    return dataProviderClient.invitationsResource.createInvitation(
      request: request,
    );
  }

  /// Returns an invitation by its id, or null if it does not exist.
  Future<Invitation?> getInvitationById({
    required String id,
  }) async {
    return dataProviderClient.invitationsResource.getInvitationById(
      id: id,
    );
  }

  /// Returns all invitations for a given barn.
  ///
  /// This can be useful for showing the owner a list of active / recent invites.
  Future<List<Invitation>> getInvitationsByBarn({
    required String barnId,
  }) async {
    return dataProviderClient.invitationsResource.getInvitationsByBarn(
      barnId: barnId,
    );
  }

  /// Deactivates an invitation (e.g. owner manually revokes it).
  ///
  /// Typically this should set `active = false` in the underlying data store.
  Future<Invitation> deactivateInvitation({
    required Invitation invitation,
  }) async {
    return dataProviderClient.invitationsResource.deactivateInvitation(
      invitation: invitation,
    );
  }

  /// Updates an invitation record.
  ///
  /// Use this if you need to modify metadata such as `active` flag or timestamps.
  Future<Invitation> updateInvitation({
    required Invitation invitation,
  }) async {
    return dataProviderClient.invitationsResource.updateInvitation(
      invitation: invitation,
    );
  }
}
