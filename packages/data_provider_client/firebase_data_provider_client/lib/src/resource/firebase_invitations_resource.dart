// data/firebase_invitations_resource.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/firebase_data_provider_client.dart';
import 'package:firebase_data_provider_client/src/extensions/firebase_collections_extensions.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:models/models.dart';
import 'package:uuid/uuid.dart';

class FirebaseInvitationsResource
    with ResourceMixin
    implements InvitationsResource {
  FirebaseInvitationsResource({FirebaseFirestore? firebase})
      : _firebase = firebase ?? FirebaseFirestore.instance,
        _uuid = const Uuid();

  final FirebaseFirestore _firebase;
  final Uuid _uuid;

  CollectionReference<Json> get _invitations => _firebase.invitations;

  @override
  Future<Invitation> createInvitation({
    required InvitationRequest request,
  }) {
    return secureCallback<Invitation>(() async {
      final id = _uuid.v4();
      final now = DateTime.now().toUtc();
      final expiresAt = now.add(const Duration(hours: 24));
      final data = {
        'id': id,
        ...request.toJson(),
        'active': true,
        'expires_at': Timestamp.fromDate(expiresAt),
        ...creationDates,
      };
      await _invitations.doc(id).set(data);
      return Invitation.fromJson(data);
    });
  }

  @override
  Future<Invitation?> getInvitationById({
    required String id,
  }) {
    return secureCallback<Invitation?>(() async {
      final doc = await _invitations.doc(id).get();
      if (!doc.exists) return null;

      final data = doc.data();
      if (data == null) return null;
      data['id'] ??= doc.id;
      return Invitation.fromJson(data);
    });
  }

  @override
  Future<List<Invitation>> getInvitationsByBarn({
    required String barnId,
  }) {
    return secureCallback<List<Invitation>>(() async {
      final snapshot = await _invitations
          .where('barn_id', isEqualTo: barnId)
          .orderBy('created_at', descending: true)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] ??= doc.id;
        return Invitation.fromJson(data);
      }).toList();
    });
  }

  @override
  Future<Invitation> deactivateInvitation({
    required Invitation invitation,
  }) {
    return secureCallback<Invitation>(() async {
      final id = invitation.id;

      await _invitations.doc(id).update({
        'active': false,
        'updated_at': FieldValue.serverTimestamp(),
      });

      // Return a local copy with updated active flag
      return invitation.copyWith(active: false);
    });
  }

  @override
  Future<Invitation> updateInvitation({
    required Invitation invitation,
  }) {
    return secureCallback<Invitation>(() async {
      final id = invitation.id;

      final updateData = <String, dynamic>{
        'barn_id': invitation.barnId,
        'barn_name': invitation.barnName,
        'role': invitation.accountType,
        'permissions': invitation.permissions,
        'active': invitation.active,
        'expires_at': Timestamp.fromDate(invitation.expiresAt),
        'updated_at': FieldValue.serverTimestamp(),
      };

      await _invitations.doc(id).update(updateData);

      // We return the same instance (logical state is already correct).
      return invitation;
    });
  }
}
