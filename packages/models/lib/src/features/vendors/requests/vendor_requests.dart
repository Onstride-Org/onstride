import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'vendor_requests.freezed.dart';
part 'vendor_requests.g.dart';

/// Payload for creating a vendor profile.
@freezed
sealed class CreateVendorProfilePayload with _$CreateVendorProfilePayload {
  const factory CreateVendorProfilePayload({
    required String userId,
    required String businessName,
    required VendorType primaryType,
    @Default(<VendorType>[]) List<VendorType> additionalTypes,
    String? description,
    String? businessEmail,
    String? businessPhone,
    String? website,
    String? address,
    String? city,
    String? state,
    String? zipCode,
    String? serviceArea,
    String? licenseNumber,
    String? insuranceInfo,
    @Default(true) bool acceptingNewClients,
    @Default(false) bool emergencyAvailable,
    @Default(<String>[]) List<String> paymentMethods,
  }) = _CreateVendorProfilePayload;

  factory CreateVendorProfilePayload.fromJson(Map<String, dynamic> json) =>
      _$CreateVendorProfilePayloadFromJson(json);
}

/// Payload for inviting a vendor to a barn.
@freezed
sealed class InviteVendorPayload with _$InviteVendorPayload {
  const factory InviteVendorPayload({
    required String barnId,
    String? barnName,
    required String vendorId,
    String? vendorName,
    VendorType? vendorType,
    required String invitedBy,
    String? notes,
    @Default(<String>[]) List<String> tags,
  }) = _InviteVendorPayload;

  factory InviteVendorPayload.fromJson(Map<String, dynamic> json) =>
      _$InviteVendorPayloadFromJson(json);
}

/// Payload for a vendor requesting to join a barn.
@freezed
sealed class VendorJoinRequestPayload with _$VendorJoinRequestPayload {
  const factory VendorJoinRequestPayload({
    required String barnId,
    String? barnName,
    required String vendorId,
    String? vendorName,
    VendorType? vendorType,
    String? message,
  }) = _VendorJoinRequestPayload;

  factory VendorJoinRequestPayload.fromJson(Map<String, dynamic> json) =>
      _$VendorJoinRequestPayloadFromJson(json);
}

/// Payload for responding to a vendor connection request.
@freezed
sealed class RespondToVendorConnectionPayload
    with _$RespondToVendorConnectionPayload {
  const factory RespondToVendorConnectionPayload({
    required String barnVendorId,
    required bool approved,
    required String respondedBy,
    String? notes,
  }) = _RespondToVendorConnectionPayload;

  factory RespondToVendorConnectionPayload.fromJson(
          Map<String, dynamic> json) =>
      _$RespondToVendorConnectionPayloadFromJson(json);
}

/// Payload for creating a vendor appointment.
@freezed
sealed class CreateAppointmentPayload with _$CreateAppointmentPayload {
  const factory CreateAppointmentPayload({
    required String barnId,
    String? barnName,
    required String vendorId,
    String? vendorName,
    required String barnVendorId,
    String? serviceId,
    String? serviceName,
    @Default(<String>[]) List<String> horseIds,
    @Default(<String>[]) List<String> horseNames,
    required DateTime scheduledAt,
    int? durationMinutes,
    required String requestedBy,
    String? requestedByName,
    String? barnNotes,
    String? location,
    double? estimatedCost,
  }) = _CreateAppointmentPayload;

  factory CreateAppointmentPayload.fromJson(Map<String, dynamic> json) =>
      _$CreateAppointmentPayloadFromJson(json);
}

/// Payload for updating an appointment status.
@freezed
sealed class UpdateAppointmentPayload with _$UpdateAppointmentPayload {
  const factory UpdateAppointmentPayload({
    required String appointmentId,
    AppointmentStatus? status,
    DateTime? scheduledAt,
    int? estimatedDuration,
    String? notes,
    List<String>? horseIds,
    List<String>? horseNames,
    String? updatedBy,
    String? vendorNotes,
    double? actualCost,
  }) = _UpdateAppointmentPayload;

  factory UpdateAppointmentPayload.fromJson(Map<String, dynamic> json) =>
      _$UpdateAppointmentPayloadFromJson(json);
}

/// Payload for adding a service to a vendor profile.
@freezed
sealed class AddVendorServicePayload with _$AddVendorServicePayload {
  const factory AddVendorServicePayload({
    required String vendorId,
    required String name,
    required VendorType type,
    String? description,
    double? basePrice,
    String? priceDescription,
    int? durationMinutes,
    @Default(0) int sortOrder,
  }) = _AddVendorServicePayload;

  factory AddVendorServicePayload.fromJson(Map<String, dynamic> json) =>
      _$AddVendorServicePayloadFromJson(json);
}
