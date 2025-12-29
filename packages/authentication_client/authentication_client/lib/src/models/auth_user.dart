// ignore_for_file: public_member_api_docs

import 'package:equatable/equatable.dart';

enum AuthAccountType { owner, manager, boarder, groomer, admin }

extension AuthAccountTypeX on AuthAccountType {
  static AuthAccountType fromString(String? value) {
    switch (value) {
      case 'owner':
        return AuthAccountType.owner;
      case 'manager':
        return AuthAccountType.manager;
      case 'boarder':
        return AuthAccountType.boarder;
      case 'groomer':
        return AuthAccountType.groomer;
      case 'admin':
        return AuthAccountType.admin;
      default:
        throw ArgumentError('Invalid account type: $value');
    }
  }
}

/// {@template user}
/// User model
///
/// [AuthUser.anonymous] represents an unauthenticated user.
/// {@endtemplate}
class AuthUser extends Equatable {
  /// {@macro user}
  const AuthUser({
    required this.id,
    required this.email,
    this.accountType,
    this.name,
    this.avatarUrl,
    this.emailVerified,
    this.finishedRegistration,
    this.registrationMethod,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String? ?? '',
      name: json['name'] as String?,
      email: json['email'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      emailVerified: json['email_verified'] as bool?,
      finishedRegistration: json['finished_registration'] as bool?,
      registrationMethod: json['registration_method'] as String?,
      accountType: AuthAccountTypeX.fromString(json['account_type'] as String?),
    );
  }

  /// The current user's email address.
  final String? email;

  /// The current user's id.
  final String id;

  final AuthAccountType? accountType;

  final String? name;

  /// Url for the current user's photo.
  final String? avatarUrl;

  final bool? emailVerified;

  final bool? finishedRegistration;

  final String? registrationMethod;

  /// Anonymous user which represents an unauthenticated user.
  static const anonymous = AuthUser(id: '', email: '');

  AuthUser copyWith({
    String? id,
    String? email,
    String? name,
    bool? finishedRegistration,
    String? avatarUrl,
    AuthAccountType? accountType,
    String? registrationMethod,
    bool? emailVerified,
  }) {
    return AuthUser(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      accountType: accountType ?? this.accountType,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      emailVerified: emailVerified ?? this.emailVerified,
      finishedRegistration: finishedRegistration ?? this.finishedRegistration,
      registrationMethod: registrationMethod ?? this.registrationMethod,
    );
  }

  @override
  List<Object?> get props => [
    id,
    email,
    name,
    avatarUrl,
    accountType,
    emailVerified,
    finishedRegistration,
    registrationMethod,
  ];
}
