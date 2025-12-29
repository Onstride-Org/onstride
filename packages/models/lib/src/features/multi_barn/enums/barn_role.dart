import 'package:json_annotation/json_annotation.dart';

/// Role a user can have within a specific barn.
@JsonEnum(fieldRename: FieldRename.snake)
enum BarnRole {
  /// Barn owner - full control
  owner,

  /// Barn administrator - nearly full control
  admin,

  /// Barn manager - operational control
  manager,

  /// Groom - task-focused access
  groomer,

  /// Boarder/client - limited access to own horses
  boarder,

  /// Trainer - lesson and training focused
  trainer,

  /// Vendor - external service provider
  vendor,
}

extension BarnRoleX on BarnRole {
  String get displayName {
    switch (this) {
      case BarnRole.owner:
        return 'Owner';
      case BarnRole.admin:
        return 'Administrator';
      case BarnRole.manager:
        return 'Manager';
      case BarnRole.groomer:
        return 'Groom';
      case BarnRole.boarder:
        return 'Boarder';
      case BarnRole.trainer:
        return 'Trainer';
      case BarnRole.vendor:
        return 'Vendor';
    }
  }

  /// Whether this role can manage barn settings.
  bool get canManageBarn {
    return this == BarnRole.owner || this == BarnRole.admin;
  }

  /// Whether this role can manage users.
  bool get canManageUsers {
    return this == BarnRole.owner ||
        this == BarnRole.admin ||
        this == BarnRole.manager;
  }

  /// Whether this role can manage horses.
  bool get canManageHorses {
    return this == BarnRole.owner ||
        this == BarnRole.admin ||
        this == BarnRole.manager ||
        this == BarnRole.trainer;
  }

  /// Whether this role can create invoices.
  bool get canInvoice {
    return this == BarnRole.owner ||
        this == BarnRole.admin ||
        this == BarnRole.manager;
  }

  /// Whether this is a staff role (not a client/boarder).
  bool get isStaff {
    return this != BarnRole.boarder && this != BarnRole.vendor;
  }
}
