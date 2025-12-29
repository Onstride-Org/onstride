import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_data_provider_client/src/extensions/firebase_collections_extensions.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:models/models.dart';
import 'package:uuid/uuid.dart';

class FirebaseInvoicesResource with ResourceMixin implements InvoicesResource {
  FirebaseInvoicesResource({
    required FirebaseApp app,
  })  : _firebase = FirebaseFirestore.instanceFor(app: app),
        _functions =
            FirebaseFunctions.instanceFor(app: app, region: 'us-central1'),
        _auth = FirebaseAuth.instanceFor(app: app);

  final Uuid uuid = const Uuid();
  final FirebaseFirestore _firebase;
  final FirebaseFunctions _functions;
  final FirebaseAuth _auth;

  CollectionReference<Map<String, dynamic>> _invoices(String barnId) =>
      _firebase.collection('barns').doc(barnId).collection('invoices');

  // String _generateInvoiceId() {
  //   final now = DateTime.now();
  //   final year = now.year.toString().substring(2);
  //   final month = now.month.toString().padLeft(2, '0');
  //   final day = now.day.toString().padLeft(2, '0');
  //   final randomPart = uuid.v4().toUpperCase();
  //   return 'INV-$year$month$day-$randomPart';
  // }

  @override
  Future<InvoiceModel> createInvoice(InvoiceRequest request) {
    return secureCallback<InvoiceModel>(() async {
      // final id = _generateInvoiceId();
      // final requestWithInvoiceId =
      //     request.copyWith(searchTerms: [...request.searchTerms, id]);
      final data = <String, dynamic>{
        'deleted_at': null,
        ...request.toJson(),
        ...creationDates,
      };
      final ref = await _invoices(request.barnId).add(data);
      await ref.update({
        'id': ref.id,
        'search_terms': buildSearchTerms([...request.searchTerms, ref.id]),
      });
      return InvoiceModel.fromJson({...data, 'id': ref.id});
    });
  }

  @override
  Future<InvoiceModel> editInvoice(
    InvoiceModel invoice,
    InvoiceRequest request,
  ) {
    return secureCallback<InvoiceModel>(() async {
      final data = <String, dynamic>{
        ...invoice.toJson(),
        ...request.toJson(),
        'deleted_at': null,
        'updated_at': FieldValue.serverTimestamp(),
      };
      await _invoices(request.barnId).doc(invoice.id).update(data);
      return InvoiceModel.fromJson(data);
    });
  }

  DocumentSnapshot<Map<String, dynamic>>? _lastInvoiceDocument;

  @override
  Future<List<InvoiceModel>> fetchInvoices({
    required String barnId,
    required bool reload,
    required String? boarderId,
    String? searchTerm,
  }) {
    return secureCallback<List<InvoiceModel>>(() async {
      if (reload || searchTerm != null) {
        _lastInvoiceDocument = null;
      }
      var query = _invoices(barnId)
          .where('barn_id', isEqualTo: barnId)
          .where('deleted_at', isNull: true)
          .orderBy('created_at', descending: true);

      if (boarderId != null && boarderId.trim().isNotEmpty) {
        query = query.where(
          'boarder_id',
          isEqualTo: boarderId,
        );
      }
      if (searchTerm != null && searchTerm.trim().isNotEmpty) {
        query = query.where(
          'search_terms',
          arrayContains: searchTerm.toLowerCase(),
        );
      }

      if (_lastInvoiceDocument != null) {
        query = query.startAfterDocument(_lastInvoiceDocument!);
      }
      final snapshot = await query.limit(defaultLimit).get();

      if (snapshot.docs.isNotEmpty) {
        _lastInvoiceDocument = snapshot.docs.last;
      }

      return snapshot.docs.map((doc) {
        final data = doc.data();
        return InvoiceModel.fromJson(data);
      }).toList();
    });
  }

  @override
  Future<void> deleteInvoice(InvoiceModel invoice) {
    return secureCallback(
      () async {
        return _firebase.barnInvoices(invoice.barnId).doc(invoice.id).delete();
      },
    );
  }

  @override
  Future<InvoiceModel> payInvoice({
    required InvoiceModel invoice,
    required PaymentBreakdown paymentBreakdown,
    required String connectedAccountId,
    required String merchantDisplayName,
    required GLPaymentMethod method,
  }) {
    return secureCallback<InvoiceModel>(() async {
      final invRef = _invoices(invoice.barnId).doc(invoice.id);
      try {
        final resp = await _createPaymentIntent(
          connectedAccountId: connectedAccountId,
          commissionPct: paymentBreakdown.platformPercentApplied,
          amountInCents: paymentBreakdown.totalCents,
          invoiceId: invoice.id,
          barnId: invoice.barnId,
          method: method,
        );

        Stripe.stripeAccountId = null;
        await Stripe.instance.applySettings();

        Stripe.stripeAccountId = connectedAccountId;
        await Stripe.instance.applySettings();

        await Stripe.instance.initPaymentSheet(
          paymentSheetParameters: SetupPaymentSheetParameters(
            paymentIntentClientSecret: resp.paymentIntentClientSecret,
            customerId: resp.customerId,
            allowsDelayedPaymentMethods: method == GLPaymentMethod.ach,
            customerEphemeralKeySecret: resp.ephemeralKeySecret,
            merchantDisplayName: merchantDisplayName,
          ),
        );

        await Stripe.instance.presentPaymentSheet();
        await invRef.update(
          {
            'method': method.name,
            'payment_breakdown': paymentBreakdown.toJson(),
          },
        );
        await Future<void>.delayed(const Duration(seconds: 1));
        final snapshot = await invRef.get();
        return InvoiceModel.fromJson(snapshot.data()!);
      } on StripeException catch (e) {
        await invRef.update({'status': InvoiceStatus.pending.name});
        log('Stripe error: code=${e.error.code} type=${e.error.type} '
            'stripeCode=${e.error.code} message=${e.error.localizedMessage}');
        rethrow;
      } catch (e) {
        await invRef.update({'status': InvoiceStatus.pending.name});
        rethrow;
      }
    });
  }

  @override
  Future<InvoiceModel> setInvoiceReceiptUrl(
    InvoiceModel invoice,
    String connectedAccountId,
  ) async {
    return secureCallback(
      () async {
        if (invoice.paymentIntentId == null) throw const NotFoundException();
        final callable = _functions.httpsCallable('getReceiptUrl');
        final resp = await callable.call({
          'paymentIntentId': invoice.paymentIntentId,
          'connectedAccountId': connectedAccountId,
        });
        final data = resp.data as Map;
        final url = data['receiptUrl'] as String?;
        if (url == null || url.isEmpty) {
          throw const PaymentIsProcessingException();
        }
        await _invoices(invoice.barnId)
            .doc(invoice.id)
            .update({'stripe.receipt_url': url});
        return invoice.copyWith(
          stripePaymentInfo:
              invoice.stripePaymentInfo?.copyWith(receiptUrl: url),
        );
      },
    );
  }

  Future<PaymentIntentResponse> _createPaymentIntent({
    required String connectedAccountId,
    required double commissionPct,
    required int amountInCents,
    required String invoiceId,
    required String barnId,
    required GLPaymentMethod method,
  }) async {
    final functionName = switch (method) {
      GLPaymentMethod.ach => 'createAchPaymentIntent',
      GLPaymentMethod.card => 'createCardPaymentIntent',
    };
    final callable = _functions.httpsCallable(functionName);
    final resp = await callable.call(<String, dynamic>{
      'connectedAccountId': connectedAccountId,
      'commissionPct': commissionPct,
      'amountCents': amountInCents,
      'invoiceId': invoiceId,
      'barnId': barnId,
    });
    final data = resp.data as Map<String, dynamic>;
    if (data.entries.isEmpty) {
      throw const NotFoundException();
    }
    return PaymentIntentResponse.fromJson(data);
  }

  @override
  Future<InvoiceModel> getInvoiceById(
      {required String barnId, required String invoiceId}) {
    return secureCallback(
      () async {
        log('getInvoiceById: BarnId:$barnId - InvoiceId:$invoiceId');
        final snapshot = await _invoices(barnId).doc(invoiceId).get();
        if (!snapshot.exists) {
          throw const NotFoundException();
        }
        return InvoiceModel.fromJson(snapshot.data()!);
      },
    );
  }
}
