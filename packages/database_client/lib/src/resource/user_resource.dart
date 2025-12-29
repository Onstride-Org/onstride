import 'package:database_client/src/db_models/db_models.dart';
import 'package:flutter/rendering.dart';
import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// {@template user_resource}
/// Resource responsible for retrieving current user related data.
/// {@endtemplate}
class UserResource {
  /// {@macro user_resource}
  UserResource({required this.box});

  Box<GLUserDb> box;

  Stream<GLUserDb?> currentUser() {
    return Hive.box<GLUserDb>(
      'user',
    ).watch().map((event) => event.value as GLUserDb?);
  }

  Future<void> saveUser(GLUserDb user) async {
    try {
      box.add(user);
    } catch (err) {
      debugPrint(err.toString());
    }
  }

  void deleteUser() {
    if (box.isNotEmpty) {
      box.deleteAt(0);
    }
  }
}
