import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:storage_client/storage_client.dart';

/// {@template firebase_storage_client}
/// A Firebase implementation of the [StorageClient] interface.
/// {@endtemplate}
class FirebaseStorageClient implements StorageClient {
  /// {@macro firebase_storage_client}
  FirebaseStorageClient({
    FirebaseStorage? firebaseStorage,
    firebase_auth.FirebaseAuth? firebaseAuth,
  })  : _firebaseStorage = firebaseStorage ?? FirebaseStorage.instance,
        _firebaseAuth = firebaseAuth ?? firebase_auth.FirebaseAuth.instance;

  final FirebaseStorage _firebaseStorage;
  final firebase_auth.FirebaseAuth _firebaseAuth;

  @override
  Future<void> delete({required String filePath}) async {
    try {
      debugPrint(_firebaseAuth.currentUser.toString());
      //   await _firebaseAuth.signInAnonymously();
      await _firebaseStorage.ref().child(filePath).delete();
    } on FirebaseException catch (err, stack) {
      throw DeleteFailure(err, stack);
    } catch (err, stack) {
      throw DeleteFailure(err, stack);
    }
  }

  @override
  Future<String> upload({required File file, required String bucket}) async {
    try {
      final snapshot = await _firebaseStorage.ref().child(bucket).putFile(file);
      return await snapshot.ref.getDownloadURL();
    } on FirebaseException catch (err, stack) {
      throw UploadFailure(err, stack);
    } catch (err, stack) {
      throw UploadFailure(err, stack);
    }
  }
}
