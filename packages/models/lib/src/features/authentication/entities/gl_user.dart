import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/src/core/core.dart';

part 'gl_user.freezed.dart';
part 'gl_user.g.dart';

@freezed
sealed class GLUser with _$GLUser {
  const factory GLUser({
    required String id,
    String? email,
    String? name,
    String? avatarUrl,
    String? phoneNumber,
    AccountType? accountType,
    bool? emailVerified,
    bool? finishedRegistration,
    RegistrationMethod? registrationMethod,
    String? barnId,
    @Default([]) List<PermissionRole> permissions,
    @NullableTimestampConverter() DateTime? deletedAt,
    String? deletedBy,
    String? deletionReason,
  }) = _GLUser;

  factory GLUser.fromJson(Map<String, dynamic> json) => _$GLUserFromJson(json);

  static const anonymous = GLUser(id: '');
}

extension GLUserExt on GLUser {
  /// Returns the user's full name, or email, or 'Unknown' if neither available.
  String get fullName => name ?? email ?? 'Unknown';

  bool get isOwner => accountType == AccountType.owner;

  bool get isGroomer => accountType == AccountType.groomer;

  bool get isBoarder => accountType == AccountType.boarder;

  bool get isManager => accountType == AccountType.manager;

  bool get isAdmin => accountType == AccountType.admin;

  bool get isEmployee =>
      accountType == AccountType.manager || accountType == AccountType.groomer;

  bool get canManageHorses =>
      permissions.contains(PermissionRole.horseManagement) || isOwner;

  bool get canManageBarn =>
      permissions.contains(PermissionRole.barnManagement) || isOwner;

  bool get canGenerateInvoices =>
      permissions.contains(PermissionRole.generateInvoices) || isOwner;

  bool get canManageUsers =>
      permissions.contains(PermissionRole.userManagement) || isOwner;

  /// Returns true if the user has at least one management permission.
  bool get hasManagementPermissions {
    if (isOwner) return true;
    return permissions.any(
      (permission) => [
        PermissionRole.horseManagement,
        PermissionRole.userManagement,
        PermissionRole.barnManagement,
        PermissionRole.generateInvoices,
      ].contains(permission),
    );
  }

  int get homeOptionsLength {
    if (isOwner) return 4;
    if (isAdmin) return 1;
    int length = 2;
    final values = {
      PermissionRole.horseManagement,
      // PermissionRole.barnManagement,
      PermissionRole.generateInvoices,
    };
    for (final per in values) {
      if (permissions.contains(per)) {
        length++;
      }
    }
    return length;
  }

  /// Returns the initials (first letters) of the user's name in uppercase.
  ///
  /// Examples:
  /// - "Kevin Meléndez" -> "KM"
  /// - "lesli" -> "L"
  /// - null or empty -> ""
  String get initials {
    if (name == null || name!.trim().isEmpty) return '';
    final parts = name!.trim().split(RegExp(r'\s+'));
    final buffer = StringBuffer();

    for (final part in parts.take(2)) {
      if (part.isNotEmpty) {
        buffer.write(part[0].toUpperCase());
      }
    }

    return buffer.toString();
  }
}

@freezed
sealed class GLUserSummary with _$GLUserSummary {
  const factory GLUserSummary({
    required String id,
    required String name,
    required AccountType accountType,
  }) = _GLUserSummary;

  factory GLUserSummary.fromJson(Map<String, dynamic> json) =>
      _$GLUserSummaryFromJson(json);
}
