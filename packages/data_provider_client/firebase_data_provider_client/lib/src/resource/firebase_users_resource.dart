import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:models/models.dart';
import 'package:uuid/uuid.dart';

///
class FirebaseUsersResource with ResourceMixin implements UsersResource {
  ///
  FirebaseUsersResource({FirebaseFirestore? firebase})
      : _firebase = firebase ?? FirebaseFirestore.instance,
        uuid = const Uuid();

  final FirebaseFirestore _firebase;
  final Uuid uuid;
  static const int _defaultLimit = 20;

  DocumentSnapshot? _lastDocument;

  @override
  Future<List<GLUser>> fetchUsersByType({
    required AccountType accountType,
  }) async {
    return secureCallback<List<GLUser>>(
      () async {
        final snapshot = await _firebase
            .collection('users')
            .where('account_type', isEqualTo: accountType.name)
            .where('deleted_at', isNull: true)
            .get();
        return snapshot.docs.map((doc) => GLUser.fromJson(doc.data())).toList();
      },
    );
  }

  /// Fetch users paginated internally.
  /// If [reload] is true, resets pagination and fetches the first page.
  @override
  Future<List<GLUser>> fetchBarnUsers({
    required String barnId,
    required bool reload,
  }) async {
    return secureCallback(
      () async {
        if (reload) {
          _lastDocument = null;
        }

        var query = _firebase
            .collection('users')
            .where('account_type', isNotEqualTo: 'owner')
            .where('barn_id', isEqualTo: barnId)
            .where('deleted_at', isNull: true)
            .limit(_defaultLimit);
        if (_lastDocument != null) {
          // query = query.startAfterDocument(_lastDocument!);
        }
        final snapshot = await query.get();
        if (snapshot.docs.isNotEmpty) {
          _lastDocument = snapshot.docs.last;
        }
        return snapshot.docs.map((doc) => GLUser.fromJson(doc.data())).toList();
      },
    );
  }

  @override
  Future<GLUser> createUser({
    required String ownerId,
    required CreateAccountRequest request,
  }) {
    return secureCallback(
      () async {
        final user = await _updateAndGetExistingUser(ownerId, request);
        if (user != null) {
          return user;
        }
        await _firebase.collection('users').doc(request.email).set(
          {
            'id': request.email,
            'deleted_at': null,
            ...request.copyWith(barnId: request.barnId).toJson(),
            'password': request.password,
          },
        );
        return GLUser.fromJson({'id': request.email, ...request.toJson()});
      },
    );
  }

  @override
  Future<GLUser> editUser({
    required GLUser user,
    required EditUserRequest request,
  }) async {
    return secureCallback(
      () async {
        final json = {'id': user.id, ...request.toJson()};
        await _firebase.collection('users').doc(user.id).update(json);
        final newJsonUser = {...user.toJson(), ...json};
        return GLUser.fromJson(newJsonUser);
      },
    );
  }

  @override
  Future<void> deleteBarnRelation({
    required GLUser user,
    required String deletedBy,
    required String barnId,
  }) {
    return secureCallback(
      () async {
        final logId = uuid.v4();
        final deleteLogRef = _firebase
            .collection('barns')
            .doc(barnId)
            .collection('delete_user_logs')
            .doc(logId);
        final batch = _firebase.batch()
          ..update(_firebase.collection('users').doc(user.id), {
            'barn_id': null,
            'permissions': <String>[],
          })
          ..delete(_firebase.collection('users').doc(user.email))
          ..set(deleteLogRef, {
            'id': logId,
            'deleted_at': FieldValue.serverTimestamp(),
            'user_deleted': user.toJson(),
            'deleted_by': deletedBy,
          });
        await batch.commit();
        return null;
      },
    );
  }

  Future<GLUser?> _updateAndGetExistingUser(
    String ownerId,
    CreateAccountRequest request,
  ) async {
    final res = await _firebase
        .collection('users')
        .where('email', isEqualTo: request.email)
        .get();
    if (res.docs.isNotEmpty) {
      final snapshot = res.docs.first;
      final user = GLUser.fromJson(snapshot.data());
      if (user.barnId == null) {
        await snapshot.reference.update({
          'barn_id': request.barnId,
          'account_type': request.accountType.name,
          'permissions': request.permissions.map((e) => e.name),
        });
        return user.copyWith(
          barnId: request.barnId,
          accountType: request.accountType,
          permissions: request.permissions,
        );
      }
      if (request.barnId == user.barnId) {
        throw const UserAlreadyAssignedInYourBarnException();
      }
      throw const UserAlreadyAssignedInAnotherBarnException();
    }
    return null;
  }

  @override
  Future<List<GLUser>> fetchUsersByIds({required List<String> ids}) {
    return secureCallback<List<GLUser>>(() async {
      if (ids.isEmpty) return const [];
      final results = <GLUser>[];
      for (var i = 0; i < ids.length; i += whereInBatchLimit) {
        final chunk = ids.sublist(i, min(i + whereInBatchLimit, ids.length));
        final querySnap = await _firebase
            .collection('users')
            .where(FieldPath.documentId, whereIn: chunk)
            .where('deleted_at', isNull: true)
            .get();
        results.addAll(querySnap.docs.map((e) => GLUser.fromJson(e.data())));
      }
      return results;
    });
  }

  @override
  Future<void> softDeleteStableOwner({
    required String ownerId,
    required String deletedBy,
    required String reason,
  }) {
    return secureCallback(
      () async {
        final batch = _firebase.batch();
        final timestamp = FieldValue.serverTimestamp();
        final ownerRef = _firebase.collection('users').doc(ownerId);
        final ownerDoc = await ownerRef.get();
        if (!ownerDoc.exists) return;

        final ownerData = ownerDoc.data()!;
        final barnId = ownerData['barn_id'] as String?;

        batch.update(ownerRef, {
          'deleted_at': timestamp,
          'deleted_by': deletedBy,
          'deletion_reason': reason,
        });

        QuerySnapshot<Map<String, dynamic>>? usersQuery;

        if (barnId != null) {
          final barnRef = _firebase.collection('barns').doc(barnId);

          batch.update(barnRef, {
            'deleted_at': timestamp,
            'deleted_by': deletedBy,
            'deletion_reason': reason,
          });

          final horsesQuery = await _firebase
              .collection('horses')
              .where('barn_id', isEqualTo: barnId)
              .get();

          for (final horseDoc in horsesQuery.docs) {
            batch.update(horseDoc.reference, {
              'deleted_at': timestamp,
              'deleted_by': deletedBy,
              'deletion_reason': reason,
            });
          }

          final tasksQuery = await _firebase
              .collection('tasks')
              .where('barn_id', isEqualTo: barnId)
              .get();

          for (final taskDoc in tasksQuery.docs) {
            batch.update(taskDoc.reference, {
              'deleted_at': timestamp,
              'deleted_by': deletedBy,
              'deletion_reason': reason,
            });
          }

          usersQuery = await _firebase
              .collection('users')
              .where('barn_id', isEqualTo: barnId)
              .get();

          for (final userDoc in usersQuery.docs) {
            final targetUid = userDoc.id;
            if (targetUid != ownerId) {
              batch.update(userDoc.reference, {
                'deleted_at': timestamp,
                'deleted_by': deletedBy,
                'deletion_reason': reason,
              });
            }
          }
        }

        await batch.commit();

        final functions = FirebaseFunctions.instance;
        final deleteAuthUserFn = functions.httpsCallable('deleteAuthUsers');
        final authUidsToDelete = <String>[ownerId];
        if (usersQuery != null) {
          for (final doc in usersQuery.docs) {
            final uid = doc.id;
            if (uid != ownerId) {
              authUidsToDelete.add(uid);
            }
          }
        }
        await deleteAuthUserFn.call({'uids': authUidsToDelete});
        return null;
      },
    );
  }
}
