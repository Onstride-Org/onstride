import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:models/models.dart';

/// {@template firebase_vendors_resource}
/// Firebase-backed resource for vendor operations.
/// {@endtemplate}
class FirebaseVendorsResource with ResourceMixin implements VendorsResource {
  /// {@macro firebase_vendors_resource}
  FirebaseVendorsResource({
    FirebaseFirestore? firebase,
  }) : _firebase = firebase ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firebase;

  CollectionReference<Map<String, dynamic>> get _vendorProfilesCollection =>
      _firebase.collection('vendor_profiles');

  CollectionReference<Map<String, dynamic>> get _barnVendorsCollection =>
      _firebase.collection('barn_vendors');

  CollectionReference<Map<String, dynamic>> get _vendorAppointmentsCollection =>
      _firebase.collection('vendor_appointments');

  CollectionReference<Map<String, dynamic>> _vendorServicesCollection(
    String vendorId,
  ) {
    return _vendorProfilesCollection.doc(vendorId).collection('services');
  }

  // ==================== Vendor Profiles ====================

  @override
  Future<VendorProfile?> getVendorProfile({required String vendorId}) async {
    return secureCallback(
      () async {
        final doc = await _vendorProfilesCollection.doc(vendorId).get();
        if (!doc.exists) return null;
        return VendorProfile.fromJson(doc.data()!);
      },
    );
  }

  @override
  Future<VendorProfile> createVendorProfile(
    CreateVendorProfilePayload payload,
  ) async {
    return secureCallback(
      () async {
        final docRef = _vendorProfilesCollection.doc();
        final now = DateTime.now();

        final profile = VendorProfile(
          id: docRef.id,
          userId: payload.userId,
          primaryType: payload.primaryType,
          additionalTypes: payload.additionalTypes,
          businessName: payload.businessName,
          businessEmail: payload.businessEmail,
          businessPhone: payload.businessPhone,
          website: payload.website,
          description: payload.description,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          zipCode: payload.zipCode,
          serviceArea: payload.serviceArea,
          licenseNumber: payload.licenseNumber,
          insuranceInfo: payload.insuranceInfo,
          acceptingNewClients: payload.acceptingNewClients,
          emergencyAvailable: payload.emergencyAvailable,
          paymentMethods: payload.paymentMethods,
          isVerified: false,
          createdAt: now,
          updatedAt: now,
        );

        await docRef.set(profile.toJson());
        return profile;
      },
    );
  }

  @override
  Future<VendorProfile> updateVendorProfile(VendorProfile profile) async {
    return secureCallback(
      () async {
        final docRef = _vendorProfilesCollection.doc(profile.id);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        final updated = profile.copyWith(updatedAt: DateTime.now());
        await docRef.set(updated.toJson(), SetOptions(merge: true));
        return updated;
      },
    );
  }

  @override
  Future<void> deleteVendorProfile({
    required String vendorId,
    required String deletedBy,
  }) async {
    return secureCallback<void>(
      () async {
        final docRef = _vendorProfilesCollection.doc(vendorId);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        // Soft delete
        await docRef.update({
          'is_active': false,
          'deleted_at': Timestamp.now(),
          'deleted_by': deletedBy,
        });
      },
    );
  }

  @override
  Future<List<VendorProfile>> searchVendors({
    VendorType? type,
    String? searchQuery,
    String? serviceArea,
    int? limit,
  }) async {
    return secureCallback(
      () async {
        Query<Map<String, dynamic>> query = _vendorProfilesCollection
            .where('deleted_at', isNull: true);

        if (type != null) {
          query = query.where('primary_type', isEqualTo: type.name);
        }

        if (serviceArea != null && serviceArea.isNotEmpty) {
          query = query.where('service_area', isEqualTo: serviceArea);
        }

        final snapshot = await query.limit(limit ?? defaultLimit).get();
        var results = snapshot.docs
            .map((doc) => VendorProfile.fromJson(doc.data()))
            .toList();

        // Client-side search filtering (Firestore doesn't support text search)
        if (searchQuery != null && searchQuery.isNotEmpty) {
          final lowerQuery = searchQuery.toLowerCase();
          results = results.where((profile) {
            return profile.businessName.toLowerCase().contains(lowerQuery) ||
                (profile.description?.toLowerCase().contains(lowerQuery) ??
                    false);
          }).toList();
        }

        return results;
      },
    );
  }

  // ==================== Vendor Services ====================

  @override
  Future<List<VendorService>> getVendorServices({
    required String vendorId,
  }) async {
    return secureCallback(
      () async {
        final snapshot = await _vendorServicesCollection(vendorId)
            .where('is_available', isEqualTo: true)
            .orderBy('name')
            .get();
        return snapshot.docs
            .map((doc) => VendorService.fromJson(doc.data()))
            .toList();
      },
    );
  }

  @override
  Future<VendorService> addVendorService(
    AddVendorServicePayload payload,
  ) async {
    return secureCallback(
      () async {
        final docRef = _vendorServicesCollection(payload.vendorId).doc();
        final now = DateTime.now();

        final service = VendorService(
          id: docRef.id,
          vendorId: payload.vendorId,
          name: payload.name,
          type: payload.type,
          description: payload.description,
          durationMinutes: payload.durationMinutes,
          basePrice: payload.basePrice,
          priceDescription: payload.priceDescription,
          sortOrder: payload.sortOrder,
          isAvailable: true,
          createdAt: now,
          updatedAt: now,
        );

        await docRef.set(service.toJson());
        return service;
      },
    );
  }

  @override
  Future<VendorService> updateVendorService(VendorService service) async {
    return secureCallback(
      () async {
        final docRef =
            _vendorServicesCollection(service.vendorId).doc(service.id);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        final updated = service.copyWith(updatedAt: DateTime.now());
        await docRef.set(updated.toJson(), SetOptions(merge: true));
        return updated;
      },
    );
  }

  @override
  Future<void> deleteVendorService({
    required String vendorId,
    required String serviceId,
  }) async {
    return secureCallback<void>(
      () async {
        final docRef = _vendorServicesCollection(vendorId).doc(serviceId);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        // Soft delete
        await docRef.update({
          'is_available': false,
          'updated_at': Timestamp.now(),
        });
      },
    );
  }

  // ==================== Barn-Vendor Connections ====================

  @override
  Future<List<BarnVendor>> getBarnVendors({required String barnId}) async {
    return secureCallback(
      () async {
        final snapshot = await _barnVendorsCollection
            .where('barn_id', isEqualTo: barnId)
            .where('status', isEqualTo: 'active')
            .orderBy('vendor_name')
            .get();
        return snapshot.docs
            .map((doc) => BarnVendor.fromJson(doc.data()))
            .toList();
      },
    );
  }

  @override
  Future<List<BarnVendor>> getVendorBarns({required String vendorId}) async {
    return secureCallback(
      () async {
        final snapshot = await _barnVendorsCollection
            .where('vendor_id', isEqualTo: vendorId)
            .where('status', isEqualTo: 'active')
            .orderBy('barn_name')
            .get();
        return snapshot.docs
            .map((doc) => BarnVendor.fromJson(doc.data()))
            .toList();
      },
    );
  }

  @override
  Future<BarnVendor?> getBarnVendorConnection({
    required String barnId,
    required String vendorId,
  }) async {
    return secureCallback(
      () async {
        final snapshot = await _barnVendorsCollection
            .where('barn_id', isEqualTo: barnId)
            .where('vendor_id', isEqualTo: vendorId)
            .limit(1)
            .get();
        if (snapshot.docs.isEmpty) return null;
        return BarnVendor.fromJson(snapshot.docs.first.data());
      },
    );
  }

  @override
  Future<BarnVendor> inviteVendor(InviteVendorPayload payload) async {
    return secureCallback(
      () async {
        // Check if connection already exists
        final existing = await getBarnVendorConnection(
          barnId: payload.barnId,
          vendorId: payload.vendorId,
        );
        if (existing != null) {
          throw ConflictException(message: 'Vendor already connected');
        }

        final docRef = _barnVendorsCollection.doc();
        final now = DateTime.now();

        final barnVendor = BarnVendor(
          id: docRef.id,
          barnId: payload.barnId,
          barnName: payload.barnName,
          vendorId: payload.vendorId,
          vendorName: payload.vendorName,
          vendorType: payload.vendorType,
          status: VendorConnectionStatus.pendingVendor,
          initiatedBy: payload.invitedBy,
          initiatedByBarn: true,
          createdAt: now,
          updatedAt: now,
          notes: payload.notes,
          tags: payload.tags,
        );

        await docRef.set(barnVendor.toJson());
        return barnVendor;
      },
    );
  }

  @override
  Future<BarnVendor> requestToJoinBarn(
    VendorJoinRequestPayload payload,
  ) async {
    return secureCallback(
      () async {
        // Check if connection already exists
        final existing = await getBarnVendorConnection(
          barnId: payload.barnId,
          vendorId: payload.vendorId,
        );
        if (existing != null) {
          throw ConflictException(message: 'Already connected to barn');
        }

        final docRef = _barnVendorsCollection.doc();
        final now = DateTime.now();

        final barnVendor = BarnVendor(
          id: docRef.id,
          barnId: payload.barnId,
          barnName: payload.barnName,
          vendorId: payload.vendorId,
          vendorName: payload.vendorName,
          vendorType: payload.vendorType,
          status: VendorConnectionStatus.pendingBarn,
          initiatedBy: payload.vendorId,
          initiatedByBarn: false,
          createdAt: now,
          updatedAt: now,
          notes: payload.message,
        );

        await docRef.set(barnVendor.toJson());
        return barnVendor;
      },
    );
  }

  @override
  Future<BarnVendor> respondToConnection(
    RespondToVendorConnectionPayload payload,
  ) async {
    return secureCallback(
      () async {
        final docRef = _barnVendorsCollection.doc(payload.barnVendorId);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        final current = BarnVendor.fromJson(doc.data()!);
        final now = DateTime.now();

        final updated = current.copyWith(
          status: payload.approved
              ? VendorConnectionStatus.active
              : VendorConnectionStatus.inactive,
          respondedBy: payload.respondedBy,
          respondedAt: now,
          updatedAt: now,
        );

        await docRef.set(updated.toJson(), SetOptions(merge: true));
        return updated;
      },
    );
  }

  @override
  Future<void> removeBarnVendor({
    required String barnVendorId,
    required String removedBy,
  }) async {
    return secureCallback<void>(
      () async {
        final docRef = _barnVendorsCollection.doc(barnVendorId);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        await docRef.update({
          'status': 'inactive',
          'updated_at': Timestamp.now(),
          'removed_by': removedBy,
        });
      },
    );
  }

  @override
  Future<BarnVendor> updateBarnVendor(BarnVendor barnVendor) async {
    return secureCallback(
      () async {
        final docRef = _barnVendorsCollection.doc(barnVendor.id);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        final updated = barnVendor.copyWith(updatedAt: DateTime.now());
        await docRef.set(updated.toJson(), SetOptions(merge: true));
        return updated;
      },
    );
  }

  // ==================== Appointments ====================

  @override
  Future<List<VendorAppointment>> getBarnAppointments({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    AppointmentStatus? statusFilter,
  }) async {
    return secureCallback(
      () async {
        Query<Map<String, dynamic>> query = _vendorAppointmentsCollection
            .where('barn_id', isEqualTo: barnId)
            .orderBy('scheduled_at', descending: true);

        if (startDate != null) {
          query = query.where(
            'scheduled_at',
            isGreaterThanOrEqualTo: Timestamp.fromDate(startDate),
          );
        }

        if (endDate != null) {
          query = query.where(
            'scheduled_at',
            isLessThanOrEqualTo: Timestamp.fromDate(endDate),
          );
        }

        if (statusFilter != null) {
          query = query.where('status', isEqualTo: statusFilter.name);
        }

        final snapshot = await query.limit(defaultLimit).get();
        return snapshot.docs
            .map((doc) => VendorAppointment.fromJson(doc.data()))
            .toList();
      },
    );
  }

  @override
  Future<List<VendorAppointment>> getVendorAppointments({
    required String vendorId,
    DateTime? startDate,
    DateTime? endDate,
    AppointmentStatus? statusFilter,
  }) async {
    return secureCallback(
      () async {
        Query<Map<String, dynamic>> query = _vendorAppointmentsCollection
            .where('vendor_id', isEqualTo: vendorId)
            .orderBy('scheduled_at', descending: true);

        if (startDate != null) {
          query = query.where(
            'scheduled_at',
            isGreaterThanOrEqualTo: Timestamp.fromDate(startDate),
          );
        }

        if (endDate != null) {
          query = query.where(
            'scheduled_at',
            isLessThanOrEqualTo: Timestamp.fromDate(endDate),
          );
        }

        if (statusFilter != null) {
          query = query.where('status', isEqualTo: statusFilter.name);
        }

        final snapshot = await query.limit(defaultLimit).get();
        return snapshot.docs
            .map((doc) => VendorAppointment.fromJson(doc.data()))
            .toList();
      },
    );
  }

  @override
  Future<VendorAppointment> createAppointment(
    CreateAppointmentPayload payload,
  ) async {
    return secureCallback(
      () async {
        final docRef = _vendorAppointmentsCollection.doc();
        final now = DateTime.now();

        final appointment = VendorAppointment(
          id: docRef.id,
          barnId: payload.barnId,
          barnName: payload.barnName,
          vendorId: payload.vendorId,
          vendorName: payload.vendorName,
          barnVendorId: payload.barnVendorId,
          serviceId: payload.serviceId,
          serviceName: payload.serviceName,
          horseIds: payload.horseIds,
          horseNames: payload.horseNames,
          scheduledAt: payload.scheduledAt,
          durationMinutes: payload.durationMinutes,
          status: AppointmentStatus.requested,
          requestedBy: payload.requestedBy,
          requestedByName: payload.requestedByName,
          barnNotes: payload.barnNotes,
          location: payload.location,
          estimatedCost: payload.estimatedCost,
          createdAt: now,
          updatedAt: now,
        );

        await docRef.set(appointment.toJson());
        return appointment;
      },
    );
  }

  @override
  Future<VendorAppointment> updateAppointment(
    UpdateAppointmentPayload payload,
  ) async {
    return secureCallback(
      () async {
        final docRef = _vendorAppointmentsCollection.doc(payload.appointmentId);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        final current = VendorAppointment.fromJson(doc.data()!);
        final now = DateTime.now();

        final updated = current.copyWith(
          scheduledAt: payload.scheduledAt ?? current.scheduledAt,
          durationMinutes:
              payload.estimatedDuration ?? current.durationMinutes,
          status: payload.status ?? current.status,
          barnNotes: payload.notes ?? current.barnNotes,
          horseIds: payload.horseIds ?? current.horseIds,
          horseNames: payload.horseNames ?? current.horseNames,
          completedAt: payload.status == AppointmentStatus.completed
              ? now
              : current.completedAt,
          actualCost: payload.actualCost ?? current.actualCost,
          vendorNotes: payload.vendorNotes ?? current.vendorNotes,
          updatedAt: now,
        );

        await docRef.set(updated.toJson(), SetOptions(merge: true));
        return updated;
      },
    );
  }

  @override
  Future<void> cancelAppointment({
    required String appointmentId,
    required String barnId,
    required String cancelledBy,
    String? reason,
  }) async {
    return secureCallback<void>(
      () async {
        final docRef = _vendorAppointmentsCollection.doc(appointmentId);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }

        await docRef.update({
          'status': 'cancelled',
          'cancelled_by': cancelledBy,
          'cancelled_at': Timestamp.now(),
          'cancellation_reason': reason,
          'updated_at': Timestamp.now(),
        });
      },
    );
  }
}
