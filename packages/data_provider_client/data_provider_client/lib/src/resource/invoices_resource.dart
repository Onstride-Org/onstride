import 'package:models/models.dart';

abstract class InvoicesResource {
  Future<InvoiceModel> createInvoice(InvoiceRequest request);

  Future<InvoiceModel> editInvoice(
    InvoiceModel invoice,
    InvoiceRequest request,
  );

  Future<List<InvoiceModel>> fetchInvoices({
    required String barnId,
    required bool reload,
    required String? boarderId,
    String? searchTerm,
  });

  Future<void> deleteInvoice(InvoiceModel invoice);

  Future<InvoiceModel> payInvoice({
    required InvoiceModel invoice,
    required PaymentBreakdown paymentBreakdown,
    required String connectedAccountId,
    required String merchantDisplayName,
    required GLPaymentMethod method,
  });

  Future<InvoiceModel> setInvoiceReceiptUrl(
    InvoiceModel invoice,
    String connectedAccountId,
  );

  Future<InvoiceModel> getInvoiceById({
    required String barnId,
    required String invoiceId,
  });
}
