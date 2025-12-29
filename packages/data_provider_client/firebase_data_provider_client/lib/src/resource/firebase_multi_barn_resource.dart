import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:models/models.dart';

/// {@template firebase_multi_barn_resource}
/// Firebase-backed resource for multi-barn operations.
/// {@endtemplate}
class FirebaseMultiBarnResource
    with ResourceMixin
    implements MultiBarnResource {
  /// {@macro firebase_multi_barn_resource}
  FirebaseMultiBarnResource({
    FirebaseFirestore? firebase,
  }) : _firebase = firebase ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firebase;

  CollectionReference<Map<String, dynamic>> get _userBarnRolesCollection =>
      _firebase.collection('user_barn_roles');

  CollectionReference<Map<String, dynamic>> get _horseTransfersCollection =>
      _firebase.collection('horse_transfers');

  CollectionReference<Map<String, dynamic>> get _barnsCollection =>
      _firebase.collection('barns');

  @override
  Future<List<UserBarnRole>> getUserBarnRoles({required String userId}) async {
    return secureCallback(
      () async {
        final snapshot = await _userBarnRolesCollection
            .where('user_id', isEqualTo: userId)
            .where('status', whereIn: ['active', 'pending'])
            .orderBy('is_primary', descending: true)
            .get();
        return snapshot.docs
            .map((doc) => UserBarnRole.fromJson(doc.data()))
            .toList();
      },
    );
  }

  @override
  Future<List<UserBarnRole>> getBarnMembers({required String barnId}) async {
    return secureCallback(
      () async {
        final snapshot = await _userBarnRolesCollection
            .where('barn_id', isEqualTo: barnId)
            .where('status', isEqualTo: 'active')
            .orderBy('role')
            .get();
        return snapshot.docs
            .map((doc) => UserBarnRole.fromJson(doc.data()))
            .toList();
      },
    );
  }

  @override
  Future<UserBarnRole?> getUserBarnRole({
    required String userId,
    required String barnId,
  }) async {
    return secureCallback(
      () async {
        final snapshot = await _userBarnRolesCollection
            .where('user_id', isEqualTo: userId)
            .where('barn_id', isEqualTo: barnId)
            .limit(1)
            .get();
        if (snapshot.docs.isEmpty) return null;
        return UserBarnRole.fromJson(snapshot.docs.first.data());
      },
    );
  }

  @override
  Future<UserBarnRole> addUserToBarn(AddUserToBarnPayload payload) async {
    return secureCallback(
      () async {
        // Check if role already exists
        final existing = await getUserBarnRole(
          userId: payload.userId,
          barnId: payload.barnId,
        );
        if (existing != null) {
          throw const ConflictException(message: 'User already in barn');
        }

        final docRef = _userBarnRolesCollection.doc();
        final now = DateTime.now();

        // Check if user has other barns
        final otherRoles = await getUserBarnRoles(userId: payload.userId);
        final isPrimary = otherRoles.isEmpty;

        final role = UserBarnRole(
          id: docRef.id,
          userId: payload.userId,
          barnId: payload.barnId,
          role: payload.role,
          status: MembershipStatus.active,
          permissions: payload.permissions ?? [],
          joinedAt: now,
          updatedAt: now,
          invitedBy: payload.invitedBy,
          isPrimary: isPrimary,
          title: payload.title,
          notes: payload.notes,
        );

        await docRef.set(role.toJson());
        return role;
      },
    );
  }

  @override
  Future<UserBarnRole> updateBarnRole(UpdateBarnRolePayload payload) async {
    return secureCallback(
      () async {
        final docRef = _userBarnRolesCollection.doc(payload.userBarnRoleId);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        final current = UserBarnRole.fromJson(doc.data()!);
        final updated = current.copyWith(
          role: payload.role ?? current.role,
          status: payload.status ?? current.status,
          permissions: payload.permissions ?? current.permissions,
          title: payload.title ?? current.title,
          notes: payload.notes ?? current.notes,
          updatedAt: DateTime.now(),
        );

        await docRef.set(updated.toJson(), SetOptions(merge: true));
        return updated;
      },
    );
  }

  @override
  Future<void> removeUserFromBarn({
    required String userId,
    required String barnId,
    required String removedBy,
  }) async {
    return secureCallback<void>(
      () async {
        final role = await getUserBarnRole(userId: userId, barnId: barnId);
        if (role == null) {
          throw const NotFoundException();
        }

        // Soft delete by setting status to inactive
        await _userBarnRolesCollection.doc(role.id).update({
          'status': 'inactive',
          'updated_at': Timestamp.now(),
          'removed_by': removedBy,
        });

        // If this was the primary barn, set another as primary
        if (role.isPrimary) {
          final otherRoles = await _userBarnRolesCollection
              .where('user_id', isEqualTo: userId)
              .where('status', isEqualTo: 'active')
              .limit(1)
              .get();

          if (otherRoles.docs.isNotEmpty) {
            await _userBarnRolesCollection.doc(otherRoles.docs.first.id).update({
              'is_primary': true,
              'updated_at': Timestamp.now(),
            });
          }
        }
      },
    );
  }

  @override
  Future<void> setPrimaryBarn({
    required String userId,
    required String barnId,
  }) async {
    return secureCallback<void>(
      () async {
        // Get current primary
        final currentPrimary = await _userBarnRolesCollection
            .where('user_id', isEqualTo: userId)
            .where('is_primary', isEqualTo: true)
            .limit(1)
            .get();

        // Get new primary
        final newPrimary = await getUserBarnRole(userId: userId, barnId: barnId);
        if (newPrimary == null) {
          throw const NotFoundException();
        }

        final batch = _firebase.batch();

        // Remove current primary
        if (currentPrimary.docs.isNotEmpty) {
          batch.update(currentPrimary.docs.first.reference, {
            'is_primary': false,
            'updated_at': Timestamp.now(),
          });
        }

        // Set new primary
        batch.update(_userBarnRolesCollection.doc(newPrimary.id), {
          'is_primary': true,
          'updated_at': Timestamp.now(),
        });

        await batch.commit();
      },
    );
  }

  @override
  Future<List<BarnSummary>> getUserBarnSummaries({
    required String userId,
  }) async {
    return secureCallback(
      () async {
        final roles = await getUserBarnRoles(userId: userId);
        final summaries = <BarnSummary>[];

        for (final role in roles) {
          final barnDoc = await _barnsCollection.doc(role.barnId).get();
          if (barnDoc.exists) {
            final barnData = barnDoc.data()!;
            summaries.add(
              BarnSummary(
                id: role.barnId,
                name: barnData['name'] as String? ?? 'Unknown Barn',
                userRole: role.role,
                isPrimary: role.isPrimary,
                logoUrl: barnData['logo_url'] as String?,
              ),
            );
          }
        }

        return summaries;
      },
    );
  }

  @override
  Future<List<HorseTransfer>> getPendingTransfers({
    required String barnId,
  }) async {
    return secureCallback(
      () async {
        // Get both incoming and outgoing pending transfers
        final incoming = await _horseTransfersCollection
            .where('to_barn_id', isEqualTo: barnId)
            .where('status', isEqualTo: 'pending')
            .get();

        final outgoing = await _horseTransfersCollection
            .where('from_barn_id', isEqualTo: barnId)
            .where('status', isEqualTo: 'pending')
            .get();

        final transfers = [
          ...incoming.docs.map((d) => HorseTransfer.fromJson(d.data())),
          ...outgoing.docs.map((d) => HorseTransfer.fromJson(d.data())),
        ];

        transfers.sort((a, b) => b.requestedAt.compareTo(a.requestedAt));
        return transfers;
      },
    );
  }

  @override
  Future<List<HorseTransfer>> getTransferHistory({
    required String barnId,
    int? limit,
  }) async {
    return secureCallback(
      () async {
        final incoming = await _horseTransfersCollection
            .where('to_barn_id', isEqualTo: barnId)
            .where('status', whereIn: ['completed', 'rejected', 'cancelled'])
            .orderBy('requested_at', descending: true)
            .limit(limit ?? 50)
            .get();

        final outgoing = await _horseTransfersCollection
            .where('from_barn_id', isEqualTo: barnId)
            .where('status', whereIn: ['completed', 'rejected', 'cancelled'])
            .orderBy('requested_at', descending: true)
            .limit(limit ?? 50)
            .get();

        final transfers = [
          ...incoming.docs.map((d) => HorseTransfer.fromJson(d.data())),
          ...outgoing.docs.map((d) => HorseTransfer.fromJson(d.data())),
        ];

        transfers.sort((a, b) => b.requestedAt.compareTo(a.requestedAt));
        return transfers.take(limit ?? 50).toList();
      },
    );
  }

  @override
  Future<HorseTransfer> initiateTransfer(
    InitiateTransferPayload payload,
  ) async {
    return secureCallback(
      () async {
        final docRef = _horseTransfersCollection.doc();
        final now = DateTime.now();

        final transfer = HorseTransfer(
          id: docRef.id,
          horseId: payload.horseId,
          horseName: payload.horseName,
          fromBarnId: payload.fromBarnId,
          fromBarnName: payload.fromBarnName,
          toBarnId: payload.toBarnId,
          toBarnName: payload.toBarnName,
          requestedBy: payload.requestedBy,
          status: TransferStatus.pending,
          requestedAt: now,
          notes: payload.notes,
          includeDocuments: payload.includeDocuments,
          includeRideLogs: payload.includeRideLogs,
        );

        await docRef.set(transfer.toJson());
        return transfer;
      },
    );
  }

  @override
  Future<HorseTransfer> respondToTransfer(
    RespondToTransferPayload payload,
  ) async {
    return secureCallback(
      () async {
        final docRef = _horseTransfersCollection.doc(payload.transferId);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        final current = HorseTransfer.fromJson(doc.data()!);
        final now = DateTime.now();

        final newStatus = payload.approved
            ? TransferStatus.approved
            : TransferStatus.rejected;
        final updated = current.copyWith(
          status: newStatus,
          respondedBy: payload.respondedBy,
          respondedAt: now,
          responseNotes: payload.responseNotes,
        );

        await docRef.set(updated.toJson(), SetOptions(merge: true));
        return updated;
      },
    );
  }

  @override
  Future<HorseTransfer> completeTransfer({required String transferId}) async {
    return secureCallback(
      () async {
        final docRef = _horseTransfersCollection.doc(transferId);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        final current = HorseTransfer.fromJson(doc.data()!);
        if (current.status != TransferStatus.approved) {
          throw const BadRequestException(
            message: 'Transfer must be approved before completing',
          );
        }

        final now = DateTime.now();
        final updated = current.copyWith(
          status: TransferStatus.completed,
          completedAt: now,
        );

        // Update transfer
        await docRef.set(updated.toJson(), SetOptions(merge: true));

        // Update horse barn_id
        await _firebase.collection('horses').doc(current.horseId).update({
          'barn_id': current.toBarnId,
          'updated_at': Timestamp.now(),
        });

        return updated;
      },
    );
  }
}
