import 'package:models/models.dart';

/// Abstract resource for vendor operations.
abstract class VendorsResource {
  // Vendor Profiles
  Future<VendorProfile?> getVendorProfile({required String vendorId});
  Future<VendorProfile> createVendorProfile(CreateVendorProfilePayload payload);
  Future<VendorProfile> updateVendorProfile(VendorProfile profile);
  Future<void> deleteVendorProfile({
    required String vendorId,
    required String deletedBy,
  });
  Future<List<VendorProfile>> searchVendors({
    VendorType? type,
    String? searchQuery,
    String? serviceArea,
    int? limit,
  });

  // Vendor Services
  Future<List<VendorService>> getVendorServices({required String vendorId});
  Future<VendorService> addVendorService(AddVendorServicePayload payload);
  Future<VendorService> updateVendorService(VendorService service);
  Future<void> deleteVendorService({
    required String vendorId,
    required String serviceId,
  });

  // Barn-Vendor Connections
  Future<List<BarnVendor>> getBarnVendors({required String barnId});
  Future<List<BarnVendor>> getVendorBarns({required String vendorId});
  Future<BarnVendor?> getBarnVendorConnection({
    required String barnId,
    required String vendorId,
  });
  Future<BarnVendor> inviteVendor(InviteVendorPayload payload);
  Future<BarnVendor> requestToJoinBarn(VendorJoinRequestPayload payload);
  Future<BarnVendor> respondToConnection(
    RespondToVendorConnectionPayload payload,
  );
  Future<void> removeBarnVendor({
    required String barnVendorId,
    required String removedBy,
  });
  Future<BarnVendor> updateBarnVendor(BarnVendor barnVendor);

  // Appointments
  Future<List<VendorAppointment>> getBarnAppointments({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    AppointmentStatus? statusFilter,
  });
  Future<List<VendorAppointment>> getVendorAppointments({
    required String vendorId,
    DateTime? startDate,
    DateTime? endDate,
    AppointmentStatus? statusFilter,
  });
  Future<VendorAppointment> createAppointment(CreateAppointmentPayload payload);
  Future<VendorAppointment> updateAppointment(UpdateAppointmentPayload payload);
  Future<void> cancelAppointment({
    required String appointmentId,
    required String barnId,
    required String cancelledBy,
    String? reason,
  });
}
