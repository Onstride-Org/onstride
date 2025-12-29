import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';

class VendorsRepository {
  VendorsRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  // ==================== Vendor Profiles ====================

  Future<VendorProfile?> getVendorProfile({required String vendorId}) {
    return dataProviderClient.vendorsResource.getVendorProfile(
      vendorId: vendorId,
    );
  }

  Future<VendorProfile> createVendorProfile(CreateVendorProfilePayload payload) {
    return dataProviderClient.vendorsResource.createVendorProfile(payload);
  }

  Future<VendorProfile> updateVendorProfile(VendorProfile profile) {
    return dataProviderClient.vendorsResource.updateVendorProfile(profile);
  }

  Future<void> deleteVendorProfile({
    required String vendorId,
    required String deletedBy,
  }) {
    return dataProviderClient.vendorsResource.deleteVendorProfile(
      vendorId: vendorId,
      deletedBy: deletedBy,
    );
  }

  Future<List<VendorProfile>> searchVendors({
    VendorType? type,
    String? searchQuery,
    String? serviceArea,
    int? limit,
  }) {
    return dataProviderClient.vendorsResource.searchVendors(
      type: type,
      searchQuery: searchQuery,
      serviceArea: serviceArea,
      limit: limit,
    );
  }

  // ==================== Vendor Services ====================

  Future<List<VendorService>> getVendorServices({required String vendorId}) {
    return dataProviderClient.vendorsResource.getVendorServices(
      vendorId: vendorId,
    );
  }

  Future<VendorService> addVendorService(AddVendorServicePayload payload) {
    return dataProviderClient.vendorsResource.addVendorService(payload);
  }

  Future<VendorService> updateVendorService(VendorService service) {
    return dataProviderClient.vendorsResource.updateVendorService(service);
  }

  Future<void> deleteVendorService({
    required String vendorId,
    required String serviceId,
  }) {
    return dataProviderClient.vendorsResource.deleteVendorService(
      vendorId: vendorId,
      serviceId: serviceId,
    );
  }

  // ==================== Barn-Vendor Connections ====================

  Future<List<BarnVendor>> getBarnVendors({required String barnId}) {
    return dataProviderClient.vendorsResource.getBarnVendors(barnId: barnId);
  }

  Future<List<BarnVendor>> getVendorBarns({required String vendorId}) {
    return dataProviderClient.vendorsResource.getVendorBarns(vendorId: vendorId);
  }

  Future<BarnVendor?> getBarnVendorConnection({
    required String barnId,
    required String vendorId,
  }) {
    return dataProviderClient.vendorsResource.getBarnVendorConnection(
      barnId: barnId,
      vendorId: vendorId,
    );
  }

  Future<BarnVendor> inviteVendor(InviteVendorPayload payload) {
    return dataProviderClient.vendorsResource.inviteVendor(payload);
  }

  Future<BarnVendor> requestToJoinBarn(VendorJoinRequestPayload payload) {
    return dataProviderClient.vendorsResource.requestToJoinBarn(payload);
  }

  Future<BarnVendor> respondToConnection(
    RespondToVendorConnectionPayload payload,
  ) {
    return dataProviderClient.vendorsResource.respondToConnection(payload);
  }

  Future<void> removeBarnVendor({
    required String barnVendorId,
    required String removedBy,
  }) {
    return dataProviderClient.vendorsResource.removeBarnVendor(
      barnVendorId: barnVendorId,
      removedBy: removedBy,
    );
  }

  Future<BarnVendor> updateBarnVendor(BarnVendor barnVendor) {
    return dataProviderClient.vendorsResource.updateBarnVendor(barnVendor);
  }

  // ==================== Appointments ====================

  Future<List<VendorAppointment>> getBarnAppointments({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    AppointmentStatus? statusFilter,
  }) {
    return dataProviderClient.vendorsResource.getBarnAppointments(
      barnId: barnId,
      startDate: startDate,
      endDate: endDate,
      statusFilter: statusFilter,
    );
  }

  Future<List<VendorAppointment>> getVendorAppointments({
    required String vendorId,
    DateTime? startDate,
    DateTime? endDate,
    AppointmentStatus? statusFilter,
  }) {
    return dataProviderClient.vendorsResource.getVendorAppointments(
      vendorId: vendorId,
      startDate: startDate,
      endDate: endDate,
      statusFilter: statusFilter,
    );
  }

  Future<VendorAppointment> createAppointment(CreateAppointmentPayload payload) {
    return dataProviderClient.vendorsResource.createAppointment(payload);
  }

  Future<VendorAppointment> updateAppointment(UpdateAppointmentPayload payload) {
    return dataProviderClient.vendorsResource.updateAppointment(payload);
  }

  Future<void> cancelAppointment({
    required String appointmentId,
    required String barnId,
    required String cancelledBy,
    String? reason,
  }) {
    return dataProviderClient.vendorsResource.cancelAppointment(
      appointmentId: appointmentId,
      barnId: barnId,
      cancelledBy: cancelledBy,
      reason: reason,
    );
  }
}
