import 'package:models/models.dart';

abstract class InvitationsResource {
  /// Creates a new invitation for a barn based on the given request.
  ///
  /// This should:
  /// - generate the invitation id
  /// - set createdAt / expiresAt
  /// - mark the invitation as active
  Future<Invitation> createInvitation({required InvitationRequest request});

  /// Returns an invitation by its id, or null if it does not exist.
  Future<Invitation?> getInvitationById({required String id});

  /// Returns all invitations for a given barn.
  ///
  /// Useful to show the owner a list of active / recent invites.
  Future<List<Invitation>> getInvitationsByBarn({required String barnId});

  /// Deactivates an invitation (e.g. owner manually revokes it).
  ///
  /// Typically this should set `active = false`.
  Future<Invitation> deactivateInvitation({required Invitation invitation});

  /// Updates an invitation record.
  ///
  /// Use this if you need to modify metadata such as `expiresAt` or `active`.
  Future<Invitation> updateInvitation({required Invitation invitation});
}
