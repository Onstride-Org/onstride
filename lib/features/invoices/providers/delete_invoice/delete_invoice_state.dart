part of 'delete_invoice_provider.dart';

@freezed
sealed class DeleteInvoiceState with _$DeleteInvoiceState {
  const factory DeleteInvoiceState.initial() = InitialDeleteInvoiceState;

  const factory DeleteInvoiceState.loading() = LoadingDeleteInvoiceState;

  const factory DeleteInvoiceState.success(InvoiceModel invoice) =
      SuccessDeleteInvoiceState;

  const factory DeleteInvoiceState.error(DataProviderException exception) =
      ErrorDeleteInvoiceState;
}
