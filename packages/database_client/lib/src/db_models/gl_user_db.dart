// ignore_for_file: public_member_api_docs

import 'package:hive/hive.dart';

part 'gl_user_db.g.dart';

/// {@template user}
/// User model for the database
/// {@endtemplate}
///
@HiveType(typeId: 1)
enum AccountTypeDb {
  @HiveField(0)
  owner,
  @HiveField(1)
  manager,
  @HiveField(2)
  boarder,
  @HiveField(3)
  groomer,
  @HiveField(4)
  admin,
}

@HiveType(typeId: 0)
class GLUserDb extends HiveObject {
  GLUserDb({
    required this.id,
    required this.email,
    required this.accountType,
    required this.registrationMethod,
    this.name,
    this.avatarUrl,
    this.emailVerified,
    this.finishedRegistration,
  });

  /// The current user's id.
  @HiveField(0)
  final String? id;

  /// The current user's email address.
  @HiveField(1)
  final String? email;

  /// Type of the user
  @HiveField(2)
  final AccountTypeDb? accountType;

  /// User's first name
  @HiveField(3)
  final String? name;

  /// Url for the current user's photo.
  @HiveField(4)
  final String? avatarUrl;

  /// Whether the user has verified their email
  @HiveField(5)
  final bool? emailVerified;

  /// Check if user finished registration
  @HiveField(6)
  final bool? finishedRegistration;

  /// Registration method
  @HiveField(7)
  final String registrationMethod;
}

extension AccountTypeDbX on AccountTypeDb {
  static AccountTypeDb fromString(String value) {
    switch (value.toLowerCase()) {
      case 'owner':
        return AccountTypeDb.owner;
      case 'manager':
        return AccountTypeDb.manager;
      case 'boarder':
        return AccountTypeDb.boarder;
      case 'groomer':
        return AccountTypeDb.groomer;
      case 'admin':
        return AccountTypeDb.admin;
      default:
        throw ArgumentError('Invalid account type: $value');
    }
  }
}
