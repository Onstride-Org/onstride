import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'vendor_profile.freezed.dart';
part 'vendor_profile.g.dart';

/// A vendor's business profile and information.
@freezed
sealed class VendorProfile with _$VendorProfile {
  const factory VendorProfile({
    /// Unique ID (same as user ID for vendor accounts)
    required String id,

    /// Link to the user account
    required String userId,

    /// Business name
    required String businessName,

    /// Primary vendor type
    required VendorType primaryType,

    /// Additional service types offered
    @Default(<VendorType>[]) List<VendorType> additionalTypes,

    /// Business description
    String? description,

    /// Contact email (may differ from user email)
    String? businessEmail,

    /// Business phone
    String? businessPhone,

    /// Website URL
    String? website,

    /// Business address
    String? address,
    String? city,
    String? state,
    String? zipCode,

    /// Service area description or radius
    String? serviceArea,

    /// Profile photo/logo URL
    String? photoUrl,

    /// License/certification number
    String? licenseNumber,

    /// Insurance info
    String? insuranceInfo,

    /// Whether the vendor is accepting new clients
    @Default(true) bool acceptingNewClients,

    /// Emergency/after-hours availability
    @Default(false) bool emergencyAvailable,

    /// Typical response time
    String? responseTime,

    /// Payment methods accepted
    @Default(<String>[]) List<String> paymentMethods,

    /// Average rating (1-5)
    double? rating,

    /// Number of reviews
    @Default(0) int reviewCount,

    /// When the profile was created
    @TimestampConverter() required DateTime createdAt,

    /// Last update
    @TimestampConverter() required DateTime updatedAt,

    /// Whether profile is verified
    @Default(false) bool isVerified,

    /// Soft delete
    @NullableTimestampConverter() DateTime? deletedAt,
    String? deletedBy,
  }) = _VendorProfile;

  factory VendorProfile.fromJson(Map<String, dynamic> json) =>
      _$VendorProfileFromJson(json);
}

extension VendorProfileX on VendorProfile {
  /// All vendor types this vendor offers.
  List<VendorType> get allTypes => [primaryType, ...additionalTypes];

  /// Full address string.
  String? get fullAddress {
    final parts = <String>[];
    if (address != null && address!.isNotEmpty) parts.add(address!);
    if (city != null && city!.isNotEmpty) parts.add(city!);
    if (state != null && state!.isNotEmpty) parts.add(state!);
    if (zipCode != null && zipCode!.isNotEmpty) parts.add(zipCode!);
    return parts.isEmpty ? null : parts.join(', ');
  }

  /// Whether the vendor is deleted.
  bool get isDeleted => deletedAt != null;
}
