part of 'pay_invoice_provider.dart';

@freezed
sealed class PayInvoiceState with _$PayInvoiceState {
  const factory PayInvoiceState.initial() = InitialPayInvoiceState;

  const factory PayInvoiceState.loading() = LoadingPayInvoiceState;

  const factory PayInvoiceState.success({
    required InvoiceModel invoice,
  }) = SuccessPayInvoiceState;

  const factory PayInvoiceState.error({
    required DataProviderException exception,
  }) = ErrorPayInvoiceState;
}
