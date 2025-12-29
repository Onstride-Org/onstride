import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'barn_vendor.freezed.dart';
part 'barn_vendor.g.dart';

/// Connection between a barn and a vendor.
@freezed
sealed class BarnVendor with _$BarnVendor {
  const factory BarnVendor({
    required String id,

    /// Barn ID
    required String barnId,

    /// Vendor profile ID
    required String vendorId,

    /// Connection status
    @Default(VendorConnectionStatus.pendingVendor)
    VendorConnectionStatus status,

    /// Cached barn name for display
    String? barnName,

    /// Cached vendor business name for display
    String? vendorName,

    /// Cached vendor type for display
    VendorType? vendorType,

    /// Who initiated the connection
    required String initiatedBy,

    /// Whether barn or vendor initiated
    @Default(true) bool initiatedByBarn,

    /// When the connection was created
    @TimestampConverter() required DateTime createdAt,

    /// When the connection was accepted/activated
    @NullableTimestampConverter() DateTime? activatedAt,

    /// Who responded to the connection request
    String? respondedBy,

    /// When response was given
    @NullableTimestampConverter() DateTime? respondedAt,

    /// Last status change
    @TimestampConverter() required DateTime updatedAt,

    /// Notes about this vendor relationship
    String? notes,

    /// Whether this is a preferred vendor
    @Default(false) bool isPreferred,

    /// Custom tags for organizing vendors
    @Default(<String>[]) List<String> tags,

    /// Horses this vendor is assigned to service
    @Default(<String>[]) List<String> assignedHorseIds,
  }) = _BarnVendor;

  factory BarnVendor.fromJson(Map<String, dynamic> json) =>
      _$BarnVendorFromJson(json);
}

extension BarnVendorX on BarnVendor {
  /// Whether the connection is active.
  bool get isActive => status.isActive;

  /// Whether there's a pending action.
  bool get isPending => status.isPending;

  /// Whether the barn needs to respond.
  bool get barnNeedsToRespond =>
      status == VendorConnectionStatus.pendingBarn;

  /// Whether the vendor needs to respond.
  bool get vendorNeedsToRespond =>
      status == VendorConnectionStatus.pendingVendor;
}
