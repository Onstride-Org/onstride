import 'dart:async';

import 'package:hive_flutter/hive_flutter.dart';

import '../database_client.dart';

/// {@template database_client}
/// Client communicating with the underlying database
/// {@endtemplate}
class DatabaseClient {
  /// {@macro database_client}
  DatabaseClient();

  /// Used to initialize the database.
  /// Should be called before using any database resources.
  Future<void> initialize() async {
    // Hive.registerAdapter<UserDbModel>(UserDbModelAdapter());
    // Hive.registerAdapter<AccountTypeDb>(AccountTypeDbAdapter());
    //await Hive.openBox<UserDbModel>('user');
  }

  /// Clears all the boxes in the database
  Future<void> clear() async {
    await Hive.box<GLUserDb>('user').clear();
  }

  Future<void> deleteStore() async {
    await Hive.deleteFromDisk();
  }

  UserResource get userResource {
    return UserResource(box: Hive.box<GLUserDb>('user'));
  }
}
