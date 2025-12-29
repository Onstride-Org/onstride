part of 'set_invoice_receipt_url_provider.dart';

@freezed
sealed class SetInvoiceReceiptUrlState with _$SetInvoiceReceiptUrlState {
  const factory SetInvoiceReceiptUrlState.initial() =
      InitialSetInvoiceReceiptUrlState;

  const factory SetInvoiceReceiptUrlState.loading() =
      LoadingSetInvoiceReceiptUrlState;

  const factory SetInvoiceReceiptUrlState.success(InvoiceModel invoice) =
      SuccessSetInvoiceReceiptUrlState;

  const factory SetInvoiceReceiptUrlState.error(
    DataProviderException exception,
  ) = ErrorSetInvoiceReceiptUrlState;
}
