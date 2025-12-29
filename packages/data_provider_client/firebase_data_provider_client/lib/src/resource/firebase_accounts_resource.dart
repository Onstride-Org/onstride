import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:models/models.dart';
import 'package:storage_client/storage_client.dart';

/// {@template accounts_resource}
/// Resource responsible for the following endpoints:
///   - /accounts/{id} GET
///   - /accounts/{id} PUT
///   - /accounts/users/reset-deleted-at
/// {@endtemplate}
class FirebaseAccountsResource with ResourceMixin implements AccountsResource {
  /// {@macro accounts_resource}
  FirebaseAccountsResource({
    required StorageClient storageClient,
  })  : _storageClient = storageClient,
        _firebase = FirebaseFirestore.instance;

  final FirebaseFirestore _firebase;
  final StorageClient _storageClient;

  @override
  Future<GLUser> registerUserInDatabase({
    required String id,
    required CreateAccountRequest request,
  }) async {
    return secureCallback(
      () async {
        final data = {
          'id': id,
          'created_at': FieldValue.serverTimestamp(),
          'updated_at': FieldValue.serverTimestamp(),
          'deleted_at': null,
          'search_terms': buildSearchTerms([request.name, request.email]),
          ...request.toJson(),
        };
        final collection = _firebase.collection('users');
        final tempUserSnap = await collection.doc(request.email).get();
        GLUser? tempUser;

        if (tempUserSnap.exists) {
          tempUser = GLUser.fromJson(tempUserSnap.data()!);
          await tempUserSnap.reference.delete();
        }
        final mergedData = {
          ...data,
          if (tempUser != null) ...{
            'barn_id': tempUser.barnId,
            'account_type': tempUser.accountType?.name,
            'permissions': tempUser.permissions.map((e) => e.name).toList(),
          },
        };
        await collection.doc(id).set(mergedData, SetOptions(merge: true));
        return GLUser.fromJson(mergedData);
      },
    );
  }

  @override
  Future<GLUser> fetchUser({
    required String id,
  }) async {
    return secureCallback(
      () async {
        final userDoc = await _firebase.collection('users').doc(id).get();
        final data = userDoc.data();
        if (data != null) {
          return GLUser.fromJson(data);
        } else {
          return GLUser(id: id);
        }
      },
    );
  }

  @override
  Future<GLUser> updateAccount({
    required GLUser user,
  }) async {
    try {
      await _firebase.collection('users').doc(user.id).set(
        {
          ...user.toJson(),
          'updated_at': FieldValue.serverTimestamp(),
          'search_terms': buildSearchTerms([user.name ?? '', user.email ?? '']),
        },
        SetOptions(merge: true),
      );
      final response = await fetchUser(id: user.id);
      return response;
    } catch (err) {
      rethrow;
    }
  }

  @override
  Future<String> updateProfilePicture({
    required GLUser user,
    required File profilePicture,
  }) async {
    try {
      final downloadUrl = await _storageClient.upload(
        bucket: 'users/${user.id}/${DateTime.now().toUtc()}',
        file: profilePicture,
      );
      return downloadUrl;
    } catch (error) {
      rethrow;
    }
  }

  @override
  Future<void> deleteAccount({
    required GLUser user,
    required String reason,
  }) async {
    try {
      // Update user with anonymized data and audit info
      await _firebase.collection('users').doc(user.id).set(
        {
          // Anonymize personal data
          'name': null,
          'email': null,
          'phone_number': null,
          'avatar_url': null,
          'password': null,
          'permissions': <dynamic>[],
          'search_terms': <dynamic>[],

          // Keep system data for audit
          'deleted': true,
          'deleted_at': FieldValue.serverTimestamp(),
          'reason_for_deletion': reason,
        },
        SetOptions(merge: true),
      );
    } catch (err) {
      rethrow;
    }
  }

  @override
  Future<void> resetDeletedAtForAllUsers() async {
    await secureCallback<void>(
      () async {
        final usersCollection = _firebase.collection('users');
        final querySnapshot = await usersCollection.get();

        var batch = _firebase.batch();
        var updateCount = 0;

        for (final doc in querySnapshot.docs) {
          batch.update(doc.reference, {
            'deleted_at': null,
          });
          updateCount++;

          if (updateCount % 500 == 0) {
            await batch.commit();
            batch = _firebase.batch();
          }
        }

        if (updateCount % 500 != 0) {
          await batch.commit();
        }
      },
    );
  }
}
