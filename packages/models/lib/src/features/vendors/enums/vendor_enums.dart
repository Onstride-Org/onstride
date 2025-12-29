import 'package:json_annotation/json_annotation.dart';

/// Type of vendor service.
@JsonEnum(fieldRename: FieldRename.snake)
enum VendorType {
  /// Veterinarian
  veterinarian,

  /// Farrier/blacksmith
  farrier,

  /// Equine dentist
  dentist,

  /// Massage therapist / chiropractor
  bodyworker,

  /// Trainer (external)
  trainer,

  /// Feed/hay supplier
  supplier,

  /// Transport services
  transport,

  /// Photographer
  photographer,

  /// Other service provider
  other,
}

extension VendorTypeX on VendorType {
  String get displayName {
    switch (this) {
      case VendorType.veterinarian:
        return 'Veterinarian';
      case VendorType.farrier:
        return 'Farrier';
      case VendorType.dentist:
        return 'Equine Dentist';
      case VendorType.bodyworker:
        return 'Bodyworker';
      case VendorType.trainer:
        return 'Trainer';
      case VendorType.supplier:
        return 'Supplier';
      case VendorType.transport:
        return 'Transport';
      case VendorType.photographer:
        return 'Photographer';
      case VendorType.other:
        return 'Other';
    }
  }

  String get icon {
    switch (this) {
      case VendorType.veterinarian:
        return 'medical_services';
      case VendorType.farrier:
        return 'hardware';
      case VendorType.dentist:
        return 'dentistry';
      case VendorType.bodyworker:
        return 'spa';
      case VendorType.trainer:
        return 'sports';
      case VendorType.supplier:
        return 'inventory';
      case VendorType.transport:
        return 'local_shipping';
      case VendorType.photographer:
        return 'camera_alt';
      case VendorType.other:
        return 'business';
    }
  }
}

/// Status of a barn-vendor connection.
@JsonEnum(fieldRename: FieldRename.snake)
enum VendorConnectionStatus {
  /// Invitation sent, waiting for vendor to accept
  pendingVendor,

  /// Vendor requested to join, waiting for barn approval
  pendingBarn,

  /// Active connection
  active,

  /// Connection suspended
  suspended,

  /// Connection terminated
  inactive,
}

extension VendorConnectionStatusX on VendorConnectionStatus {
  String get displayName {
    switch (this) {
      case VendorConnectionStatus.pendingVendor:
        return 'Awaiting Vendor';
      case VendorConnectionStatus.pendingBarn:
        return 'Awaiting Barn';
      case VendorConnectionStatus.active:
        return 'Active';
      case VendorConnectionStatus.suspended:
        return 'Suspended';
      case VendorConnectionStatus.inactive:
        return 'Inactive';
    }
  }

  bool get isActive => this == VendorConnectionStatus.active;
  bool get isPending =>
      this == VendorConnectionStatus.pendingVendor ||
      this == VendorConnectionStatus.pendingBarn;
}

/// Status of a vendor appointment.
@JsonEnum(fieldRename: FieldRename.snake)
enum AppointmentStatus {
  /// Requested by barn, waiting for vendor confirmation
  requested,

  /// Confirmed by vendor
  confirmed,

  /// In progress
  inProgress,

  /// Completed
  completed,

  /// Cancelled
  cancelled,

  /// No-show
  noShow,
}

extension AppointmentStatusX on AppointmentStatus {
  String get displayName {
    switch (this) {
      case AppointmentStatus.requested:
        return 'Requested';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.inProgress:
        return 'In Progress';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.noShow:
        return 'No Show';
    }
  }

  bool get isUpcoming =>
      this == AppointmentStatus.requested || this == AppointmentStatus.confirmed;
  bool get isFinal =>
      this == AppointmentStatus.completed ||
      this == AppointmentStatus.cancelled ||
      this == AppointmentStatus.noShow;
}
