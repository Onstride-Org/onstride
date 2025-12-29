import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'user_barn_role.freezed.dart';
part 'user_barn_role.g.dart';

/// Represents a user's role and permissions within a specific barn.
/// This is the core model for multi-barn support.
@freezed
sealed class UserBarnRole with _$UserBarnRole {
  const factory UserBarnRole({
    /// Unique ID for this relationship
    required String id,

    /// The user's ID
    required String userId,

    /// The barn's ID
    required String barnId,

    /// The user's role in this barn
    required BarnRole role,

    /// Membership status
    @Default(MembershipStatus.active) MembershipStatus status,

    /// Specific permissions granted (beyond role defaults)
    @Default(<PermissionRole>[]) List<PermissionRole> permissions,

    /// When the user joined this barn
    @TimestampConverter() required DateTime joinedAt,

    /// Who invited/added this user
    String? invitedBy,

    /// Last time this membership was updated
    @TimestampConverter() required DateTime updatedAt,

    /// For display purposes - cached barn name
    String? barnName,

    /// For display purposes - cached user name
    String? userName,

    /// Whether this is the user's primary/default barn
    @Default(false) bool isPrimary,

    /// Custom title/position (e.g., "Head Trainer", "Barn Manager")
    String? title,

    /// Notes about this membership
    String? notes,
  }) = _UserBarnRole;

  factory UserBarnRole.fromJson(Map<String, dynamic> json) =>
      _$UserBarnRoleFromJson(json);
}

extension UserBarnRoleX on UserBarnRole {
  /// Check if the user has a specific permission (either through role or explicit).
  bool hasPermission(PermissionRole permission) {
    // Check explicit permissions first
    if (permissions.contains(permission)) return true;

    // Check role-based permissions
    switch (permission) {
      case PermissionRole.userManagement:
        return role.canManageUsers;
      case PermissionRole.horseManagement:
        return role.canManageHorses;
      case PermissionRole.barnManagement:
        return role.canManageBarn;
      case PermissionRole.generateInvoices:
        return role.canInvoice;
    }
  }

  /// Whether the user can access this barn.
  bool get canAccess => status.canAccess;

  /// Display string for role and title.
  String get roleDisplay {
    if (title != null && title!.isNotEmpty) {
      return title!;
    }
    return role.displayName;
  }
}
