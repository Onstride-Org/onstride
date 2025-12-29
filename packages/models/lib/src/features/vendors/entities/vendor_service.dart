import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'vendor_service.freezed.dart';
part 'vendor_service.g.dart';

/// A specific service offered by a vendor.
@freezed
sealed class VendorService with _$VendorService {
  const factory VendorService({
    required String id,

    /// Vendor profile ID
    required String vendorId,

    /// Service name
    required String name,

    /// Service description
    String? description,

    /// Service category/type
    required VendorType type,

    /// Base price (may vary)
    double? basePrice,

    /// Price description (e.g., "Starting at $50", "Call for quote")
    String? priceDescription,

    /// Estimated duration in minutes
    int? durationMinutes,

    /// Whether this service is currently available
    @Default(true) bool isAvailable,

    /// Display order
    @Default(0) int sortOrder,

    /// Created timestamp
    @TimestampConverter() required DateTime createdAt,

    /// Updated timestamp
    @TimestampConverter() required DateTime updatedAt,
  }) = _VendorService;

  factory VendorService.fromJson(Map<String, dynamic> json) =>
      _$VendorServiceFromJson(json);
}

extension VendorServiceX on VendorService {
  /// Formatted duration string.
  String? get durationDisplay {
    if (durationMinutes == null) return null;
    if (durationMinutes! < 60) return '$durationMinutes min';
    final hours = durationMinutes! ~/ 60;
    final mins = durationMinutes! % 60;
    if (mins == 0) return '$hours hr';
    return '$hours hr $mins min';
  }
}
