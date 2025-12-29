import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'vendor_appointment.freezed.dart';
part 'vendor_appointment.g.dart';

/// An appointment between a vendor and a barn/horse.
@freezed
sealed class VendorAppointment with _$VendorAppointment {
  const factory VendorAppointment({
    required String id,

    /// Barn ID
    required String barnId,

    /// Vendor profile ID
    required String vendorId,

    /// Barn-vendor connection ID
    required String barnVendorId,

    /// Service being performed
    String? serviceId,
    String? serviceName,

    /// Horses involved in this appointment
    @Default(<String>[]) List<String> horseIds,
    @Default(<String>[]) List<String> horseNames,

    /// Appointment status
    @Default(AppointmentStatus.requested) AppointmentStatus status,

    /// Scheduled date and time
    @TimestampConverter() required DateTime scheduledAt,

    /// Estimated duration in minutes
    int? durationMinutes,

    /// Actual end time (when completed)
    @NullableTimestampConverter() DateTime? completedAt,

    /// Who requested the appointment
    required String requestedBy,
    String? requestedByName,

    /// Notes/instructions from barn
    String? barnNotes,

    /// Notes from vendor
    String? vendorNotes,

    /// Visit notes (post-appointment documentation)
    String? visitNotes,

    /// Location within barn (e.g., "Stall 5", "Arena")
    String? location,

    /// Whether the horse owner has been notified
    @Default(false) bool ownerNotified,

    /// Associated documents (e.g., health certificates uploaded)
    @Default(<String>[]) List<String> documentIds,

    /// Cost estimate
    double? estimatedCost,

    /// Actual cost (after completion)
    double? actualCost,

    /// Whether an invoice has been created
    @Default(false) bool invoiced,
    String? invoiceId,

    /// When the appointment was created
    @TimestampConverter() required DateTime createdAt,

    /// Last update
    @TimestampConverter() required DateTime updatedAt,

    /// Cached vendor business name
    String? vendorName,

    /// Cached barn name
    String? barnName,
  }) = _VendorAppointment;

  factory VendorAppointment.fromJson(Map<String, dynamic> json) =>
      _$VendorAppointmentFromJson(json);
}

extension VendorAppointmentX on VendorAppointment {
  /// Whether the appointment is upcoming.
  bool get isUpcoming => status.isUpcoming;

  /// Whether the appointment is in a final state.
  bool get isFinal => status.isFinal;

  /// Formatted duration string.
  String? get durationDisplay {
    if (durationMinutes == null) return null;
    if (durationMinutes! < 60) return '$durationMinutes min';
    final hours = durationMinutes! ~/ 60;
    final mins = durationMinutes! % 60;
    if (mins == 0) return '$hours hr';
    return '$hours hr $mins min';
  }

  /// Number of horses in this appointment.
  int get horseCount => horseIds.length;
}
