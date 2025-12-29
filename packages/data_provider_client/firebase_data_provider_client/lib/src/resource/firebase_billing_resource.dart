import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:models/models.dart';

/// {@template firebase_billing_resource}
/// Firebase-backed resource for managing billing, charges, and templates.
/// {@endtemplate}
class FirebaseBillingResource with ResourceMixin implements BillingResource {
  /// {@macro firebase_billing_resource}
  FirebaseBillingResource({
    FirebaseFirestore? firebase,
  }) : _firebase = firebase ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firebase;

  CollectionReference<Map<String, dynamic>> _billingPeriods(String barnId) =>
      _firebase.collection('barns').doc(barnId).collection('billing_periods');

  CollectionReference<Map<String, dynamic>> _charges(String barnId) =>
      _firebase.collection('barns').doc(barnId).collection('charges');

  CollectionReference<Map<String, dynamic>> _clientTabs(String barnId) =>
      _firebase.collection('barns').doc(barnId).collection('client_tabs');

  CollectionReference<Map<String, dynamic>> _billingTemplates(String barnId) =>
      _firebase.collection('barns').doc(barnId).collection('billing_templates');

  // ============ BILLING PERIODS ============

  @override
  Future<BillingPeriodModel> createBillingPeriod(
      CreateBillingPeriodPayload payload) {
    return secureCallback(() async {
      final docRef = _billingPeriods(payload.barnId).doc();
      final now = DateTime.now();

      final period = BillingPeriodModel(
        id: docRef.id,
        barnId: payload.barnId,
        clientId: payload.clientId,
        clientName: payload.clientName,
        startDate: payload.startDate,
        endDate: payload.endDate,
        dueDate: payload.dueDate,
        status: BillingPeriodStatus.open,
        previousBalance: payload.previousBalance,
        notes: payload.notes,
        createdAt: now,
        updatedAt: now,
      );

      await docRef.set(period.toJson());
      return period;
    });
  }

  @override
  Future<List<BillingPeriodModel>> getClientBillingPeriods({
    required String clientId,
    required String barnId,
    BillingPeriodStatus? statusFilter,
  }) {
    return secureCallback(() async {
      var query = _billingPeriods(barnId)
          .where('client_id', isEqualTo: clientId)
          .where('deleted_at', isNull: true)
          .orderBy('start_date', descending: true);

      if (statusFilter != null) {
        query = query.where('status', isEqualTo: statusFilter.name);
      }

      final snapshot = await query.limit(defaultLimit).get();
      return snapshot.docs
          .map((doc) => BillingPeriodModel.fromJson(doc.data()))
          .toList();
    });
  }

  @override
  Future<List<BillingPeriodModel>> getBarnBillingPeriods({
    required String barnId,
    BillingPeriodStatus? statusFilter,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return secureCallback(() async {
      var query = _billingPeriods(barnId)
          .where('deleted_at', isNull: true)
          .orderBy('start_date', descending: true);

      if (statusFilter != null) {
        query = query.where('status', isEqualTo: statusFilter.name);
      }
      if (startDate != null) {
        query = query.where('start_date',
            isGreaterThanOrEqualTo: Timestamp.fromDate(startDate));
      }
      if (endDate != null) {
        query = query.where('end_date',
            isLessThanOrEqualTo: Timestamp.fromDate(endDate));
      }

      final snapshot = await query.limit(defaultLimit).get();
      return snapshot.docs
          .map((doc) => BillingPeriodModel.fromJson(doc.data()))
          .toList();
    });
  }

  @override
  Future<BillingPeriodModel> getBillingPeriod({
    required String id,
    required String barnId,
  }) {
    return secureCallback(() async {
      final doc = await _billingPeriods(barnId).doc(id).get();
      if (!doc.exists) throw const NotFoundException();
      return BillingPeriodModel.fromJson(doc.data()!);
    });
  }

  @override
  Future<BillingPeriodModel> updateBillingPeriod(BillingPeriodModel period) {
    return secureCallback(() async {
      final docRef = _billingPeriods(period.barnId).doc(period.id);
      final updated = period.copyWith(updatedAt: DateTime.now());
      await docRef.set(updated.toJson(), SetOptions(merge: true));
      return updated;
    });
  }

  @override
  Future<BillingPeriodModel> closeBillingPeriod({
    required String id,
    required String barnId,
  }) {
    return secureCallback(() async {
      final docRef = _billingPeriods(barnId).doc(id);
      final doc = await docRef.get();
      if (!doc.exists) throw const NotFoundException();

      final period = BillingPeriodModel.fromJson(doc.data()!);

      // Calculate total charges
      final chargesSnapshot = await _charges(barnId)
          .where('billing_period_id', isEqualTo: id)
          .where('status', isEqualTo: ChargeStatus.pending.name)
          .where('deleted_at', isNull: true)
          .get();

      double total = 0;
      for (final chargeDoc in chargesSnapshot.docs) {
        final charge = ChargeModel.fromJson(chargeDoc.data());
        total += charge.total;
        // Mark charge as billed
        await chargeDoc.reference.update({'status': ChargeStatus.billed.name});
      }

      final updatedPeriod = period.copyWith(
        status: BillingPeriodStatus.closed,
        totalCharges: total,
        updatedAt: DateTime.now(),
      );

      await docRef.set(updatedPeriod.toJson(), SetOptions(merge: true));
      return updatedPeriod;
    });
  }

  // ============ CHARGES ============

  @override
  Future<ChargeModel> createCharge(CreateChargePayload payload) {
    return secureCallback(() async {
      final docRef = _charges(payload.barnId).doc();
      final now = DateTime.now();

      final charge = ChargeModel(
        id: docRef.id,
        barnId: payload.barnId,
        clientId: payload.clientId,
        type: payload.type,
        description: payload.description,
        amount: payload.amount,
        quantity: payload.quantity,
        status: ChargeStatus.pending,
        chargeDate: payload.chargeDate,
        horseId: payload.horseId,
        horseName: payload.horseName,
        billingPeriodId: payload.billingPeriodId,
        lessonId: payload.lessonId,
        isOneOff: payload.isOneOff,
        createdById: payload.createdById,
        createdByName: payload.createdByName,
        notes: payload.notes,
        createdAt: now,
        updatedAt: now,
      );

      await docRef.set(charge.toJson());

      // Update client tab
      await _updateClientTabCharges(
        barnId: payload.barnId,
        clientId: payload.clientId,
        amount: charge.total,
      );

      return charge;
    });
  }

  @override
  Future<List<ChargeModel>> getPeriodCharges({
    required String billingPeriodId,
    required String barnId,
  }) {
    return secureCallback(() async {
      final snapshot = await _charges(barnId)
          .where('billing_period_id', isEqualTo: billingPeriodId)
          .where('deleted_at', isNull: true)
          .orderBy('charge_date', descending: true)
          .get();

      return snapshot.docs
          .map((doc) => ChargeModel.fromJson(doc.data()))
          .toList();
    });
  }

  @override
  Future<List<ChargeModel>> getClientCharges({
    required String clientId,
    required String barnId,
    ChargeStatus? statusFilter,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return secureCallback(() async {
      var query = _charges(barnId)
          .where('client_id', isEqualTo: clientId)
          .where('deleted_at', isNull: true)
          .orderBy('charge_date', descending: true);

      if (statusFilter != null) {
        query = query.where('status', isEqualTo: statusFilter.name);
      }
      if (startDate != null) {
        query = query.where('charge_date',
            isGreaterThanOrEqualTo: Timestamp.fromDate(startDate));
      }
      if (endDate != null) {
        query = query.where('charge_date',
            isLessThanOrEqualTo: Timestamp.fromDate(endDate));
      }

      final snapshot = await query.limit(defaultLimit).get();
      return snapshot.docs
          .map((doc) => ChargeModel.fromJson(doc.data()))
          .toList();
    });
  }

  @override
  Future<ChargeModel> getCharge({
    required String id,
    required String barnId,
  }) {
    return secureCallback(() async {
      final doc = await _charges(barnId).doc(id).get();
      if (!doc.exists) throw const NotFoundException();
      return ChargeModel.fromJson(doc.data()!);
    });
  }

  @override
  Future<ChargeModel> updateCharge(ChargeModel charge) {
    return secureCallback(() async {
      final docRef = _charges(charge.barnId).doc(charge.id);
      final updated = charge.copyWith(updatedAt: DateTime.now());
      await docRef.set(updated.toJson(), SetOptions(merge: true));
      return updated;
    });
  }

  @override
  Future<void> deleteCharge({
    required String id,
    required String barnId,
    required String deletedBy,
  }) {
    return secureCallback<void>(() async {
      final docRef = _charges(barnId).doc(id);
      final doc = await docRef.get();
      if (!doc.exists) throw const NotFoundException();

      final charge = ChargeModel.fromJson(doc.data()!);

      await docRef.update({
        'deleted_at': Timestamp.now(),
        'deleted_by': deletedBy,
        'status': ChargeStatus.cancelled.name,
      });

      // Update client tab
      await _updateClientTabCharges(
        barnId: barnId,
        clientId: charge.clientId,
        amount: -charge.total,
      );
    });
  }

  // ============ CLIENT TABS ============

  @override
  Future<ClientTabModel> getClientTab({
    required String clientId,
    required String barnId,
  }) {
    return secureCallback(() async {
      final doc = await _clientTabs(barnId).doc(clientId).get();
      if (!doc.exists) {
        // Create default tab if doesn't exist
        return ClientTabModel(
          id: clientId,
          barnId: barnId,
          clientId: clientId,
          clientName: '',
          updatedAt: DateTime.now(),
        );
      }
      return ClientTabModel.fromJson(doc.data()!);
    });
  }

  @override
  Future<List<ClientTabModel>> getBarnClientTabs({
    required String barnId,
  }) {
    return secureCallback(() async {
      final snapshot = await _clientTabs(barnId)
          .orderBy('total_balance', descending: true)
          .limit(defaultLimit)
          .get();

      return snapshot.docs
          .map((doc) => ClientTabModel.fromJson(doc.data()))
          .toList();
    });
  }

  @override
  Future<ClientTabModel> recalculateClientTab({
    required String clientId,
    required String barnId,
  }) {
    return secureCallback(() async {
      // Get all pending charges
      final pendingCharges = await _charges(barnId)
          .where('client_id', isEqualTo: clientId)
          .where('status', isEqualTo: ChargeStatus.pending.name)
          .where('deleted_at', isNull: true)
          .get();

      double pendingTotal = 0;
      for (final doc in pendingCharges.docs) {
        final charge = ChargeModel.fromJson(doc.data());
        pendingTotal += charge.total;
      }

      // Get outstanding invoices (billed but not paid)
      final billedCharges = await _charges(barnId)
          .where('client_id', isEqualTo: clientId)
          .where('status', isEqualTo: ChargeStatus.billed.name)
          .where('deleted_at', isNull: true)
          .get();

      double billedTotal = 0;
      for (final doc in billedCharges.docs) {
        final charge = ChargeModel.fromJson(doc.data());
        billedTotal += charge.total;
      }

      // Get or create client tab
      final tabDoc = await _clientTabs(barnId).doc(clientId).get();
      final existingTab = tabDoc.exists
          ? ClientTabModel.fromJson(tabDoc.data()!)
          : ClientTabModel(
              id: clientId,
              barnId: barnId,
              clientId: clientId,
              clientName: '',
              updatedAt: DateTime.now(),
            );

      final updatedTab = existingTab.copyWith(
        pendingCharges: pendingTotal,
        totalBalance: pendingTotal + billedTotal,
        updatedAt: DateTime.now(),
      );

      await _clientTabs(barnId)
          .doc(clientId)
          .set(updatedTab.toJson(), SetOptions(merge: true));

      return updatedTab;
    });
  }

  Future<void> _updateClientTabCharges({
    required String barnId,
    required String clientId,
    required double amount,
  }) async {
    final tabRef = _clientTabs(barnId).doc(clientId);
    final tabDoc = await tabRef.get();

    if (tabDoc.exists) {
      await tabRef.update({
        'pending_charges': FieldValue.increment(amount),
        'total_balance': FieldValue.increment(amount),
        'updated_at': Timestamp.now(),
      });
    } else {
      final tab = ClientTabModel(
        id: clientId,
        barnId: barnId,
        clientId: clientId,
        clientName: '',
        pendingCharges: amount > 0 ? amount : 0,
        totalBalance: amount > 0 ? amount : 0,
        updatedAt: DateTime.now(),
      );
      await tabRef.set(tab.toJson());
    }
  }

  // ============ BILLING TEMPLATES ============

  @override
  Future<BillingTemplateModel> createBillingTemplate(
      CreateBillingTemplatePayload payload) {
    return secureCallback(() async {
      final docRef = _billingTemplates(payload.barnId).doc();
      final now = DateTime.now();

      final template = BillingTemplateModel(
        id: docRef.id,
        barnId: payload.barnId,
        name: payload.name,
        description: payload.description,
        lineItems: payload.lineItems,
        taxRate: payload.taxRate,
        applyTax: payload.applyTax,
        discountPercent: payload.discountPercent,
        discountAmount: payload.discountAmount,
        season: payload.season,
        category: payload.category,
        isDefault: payload.isDefault,
        createdById: payload.createdById,
        createdAt: now,
        updatedAt: now,
      );

      await docRef.set(template.toJson());
      return template;
    });
  }

  @override
  Future<List<BillingTemplateModel>> getBarnTemplates({
    required String barnId,
  }) {
    return secureCallback(() async {
      final snapshot = await _billingTemplates(barnId)
          .where('deleted_at', isNull: true)
          .orderBy('name')
          .get();

      return snapshot.docs
          .map((doc) => BillingTemplateModel.fromJson(doc.data()))
          .toList();
    });
  }

  @override
  Future<BillingTemplateModel> getBillingTemplate({
    required String id,
    required String barnId,
  }) {
    return secureCallback(() async {
      final doc = await _billingTemplates(barnId).doc(id).get();
      if (!doc.exists) throw const NotFoundException();
      return BillingTemplateModel.fromJson(doc.data()!);
    });
  }

  @override
  Future<BillingTemplateModel> updateBillingTemplate(
      BillingTemplateModel template) {
    return secureCallback(() async {
      final docRef = _billingTemplates(template.barnId).doc(template.id);
      final updated = template.copyWith(updatedAt: DateTime.now());
      await docRef.set(updated.toJson(), SetOptions(merge: true));
      return updated;
    });
  }

  @override
  Future<void> deleteBillingTemplate({
    required String id,
    required String barnId,
    required String deletedBy,
  }) {
    return secureCallback<void>(() async {
      await _billingTemplates(barnId).doc(id).update({
        'deleted_at': Timestamp.now(),
        'deleted_by': deletedBy,
      });
    });
  }

  @override
  Future<List<ChargeModel>> applyTemplate(ApplyTemplatePayload payload) {
    return secureCallback(() async {
      final template =
          await getBillingTemplate(id: payload.templateId, barnId: '');
      final charges = <ChargeModel>[];

      for (final item in template.lineItems) {
        if (payload.excludeItemIds.contains(item.id)) continue;

        final quantity =
            payload.quantityOverrides[item.id] ?? item.defaultQuantity;
        if (quantity <= 0) continue;

        // Get barnId from the billing period
        final period = await getBillingPeriod(
          id: payload.billingPeriodId,
          barnId: template.barnId,
        );

        final chargePayload = CreateChargePayload(
          barnId: period.barnId,
          clientId: payload.clientId,
          type: item.type,
          description: item.description,
          amount: item.amount,
          quantity: quantity,
          chargeDate: DateTime.now(),
          billingPeriodId: payload.billingPeriodId,
          notes: item.notes,
        );

        final charge = await createCharge(chargePayload);
        charges.add(charge);
      }

      return charges;
    });
  }
}
