import 'package:json_annotation/json_annotation.dart';

/// Status of a user's membership in a barn.
@JsonEnum(fieldRename: FieldRename.snake)
enum MembershipStatus {
  /// Invitation sent, waiting for user to accept
  pending,

  /// User is an active member of the barn
  active,

  /// User has been suspended (temporary)
  suspended,

  /// User has left or been removed from the barn
  inactive,
}

extension MembershipStatusX on MembershipStatus {
  String get displayName {
    switch (this) {
      case MembershipStatus.pending:
        return 'Pending';
      case MembershipStatus.active:
        return 'Active';
      case MembershipStatus.suspended:
        return 'Suspended';
      case MembershipStatus.inactive:
        return 'Inactive';
    }
  }

  /// Whether the user can access the barn.
  bool get canAccess => this == MembershipStatus.active;
}
