// data/horses_repository.dart
import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';

class InvoicesRepository {
  InvoicesRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  Future<InvoiceModel> createInvoice(InvoiceRequest request) {
    return dataProviderClient.invoicesResource.createInvoice(request);
  }

  Future<InvoiceModel> editInvoice(
    InvoiceModel invoice,
    InvoiceRequest request,
  ) {
    return dataProviderClient.invoicesResource.editInvoice(invoice, request);
  }

  Future<List<InvoiceModel>> fetchInvoices({
    required String barnId,
    required bool reload,
    required String? boarderId,
    String? searchTerm,
  }) {
    return dataProviderClient.invoicesResource.fetchInvoices(
      barnId: barnId,
      reload: reload,
      boarderId: boarderId,
      searchTerm: searchTerm,
    );
  }

  Future<void> deleteInvoice({required InvoiceModel invoice}) {
    return dataProviderClient.invoicesResource.deleteInvoice(invoice);
  }

  Future<InvoiceModel> payInvoice({
    required InvoiceModel invoice,
    required PaymentBreakdown paymentBreakdown,
    required String connectedAccountId,
    required GLPaymentMethod method,
    String merchantDisplayName = 'OnStride',
  }) {
    return dataProviderClient.invoicesResource.payInvoice(
      invoice: invoice,
      connectedAccountId: connectedAccountId,
      paymentBreakdown: paymentBreakdown,
      method: method,
      merchantDisplayName: merchantDisplayName,
    );
  }

  Future<InvoiceModel> setInvoiceReceiptUrl({
    required InvoiceModel invoice,
    required String connectedAccountId,
  }) {
    return dataProviderClient.invoicesResource.setInvoiceReceiptUrl(
      invoice,
      connectedAccountId,
    );
  }

  Future<InvoiceModel> getInvoiceById({
    required String barnId,
    required String invoiceId,
  }) {
    return dataProviderClient.invoicesResource.getInvoiceById(
      barnId: barnId,
      invoiceId: invoiceId,
    );
  }
}
