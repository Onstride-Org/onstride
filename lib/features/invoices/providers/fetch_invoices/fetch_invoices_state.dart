part of 'fetch_invoices_provider.dart';

@freezed
sealed class FetchInvoicesState with _$FetchInvoicesState {
  const factory FetchInvoicesState({
    @Default(<InvoiceModel>[]) List<InvoiceModel> invoices,
    @Default(<InvoiceModel>[]) List<InvoiceModel> searchInvoices,
    @Default('') String searchTerm,
    @Default(false) bool isSearching,
    @Default(true) bool hasMoreData,
    @Default(false) bool isLoading,
    DataProviderException? exception,
    String? boarderId,
  }) = _FetchInvoicesState;
}

extension FetchInvoicesStateExt on FetchInvoicesState {
  InvoiceModel? getInvoiceById(String? id) {
    if (id == null) return null;
    final list = isSearching ? searchInvoices : invoices;
    if (list.isEmpty) return null;
    for (final inv in list) {
      if (inv.id == id) return inv;
    }
    return null;
  }
}
