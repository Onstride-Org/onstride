import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:invoices_repository/invoices_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fetch_invoices_provider.freezed.dart';
part 'fetch_invoices_provider.g.dart';
part 'fetch_invoices_state.dart';

@Riverpod(keepAlive: true)
class FetchInvoices extends _$FetchInvoices {
  InvoicesRepository get _repository => ref.read(invoicesRepositoryProvider);

  @override
  FetchInvoicesState build() => const FetchInvoicesState();

  Future<InvoiceModel?> fetchInvoiceById(
    String invoiceId,
    String barnId,
  ) async {
    if (invoiceId.isEmpty) return null;
    // set loading (keep current hasMoreData/isSearching)
    state = state.copyWith(isLoading: true, exception: null);

    try {
      // Adjust this call name to your repository method if needed.
      final invoice = await _repository.getInvoiceById(
        barnId: barnId,
        invoiceId: invoiceId,
      );

      // If repository returns null or throws when not found, handle both
      if (invoice == null) {
        state = state.copyWith(isLoading: false);
        return null;
      }

      List<InvoiceModel> _upsert(List<InvoiceModel> list) {
        final idx = list.indexWhere((i) => i.id == invoice.id);
        if (idx == -1) {
          // prepend newest to the top (consistent with addInvoice)
          return <InvoiceModel>[invoice, ...list];
        }
        final copy = List<InvoiceModel>.from(list);
        copy[idx] = invoice;
        return copy;
      }

      state = state.copyWith(
        invoices: _upsert(state.invoices),
        isLoading: false,
      );

      return invoice;
    } on DataProviderException catch (e) {
      state = state.copyWith(isLoading: false, exception: e);
      return null;
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        exception: const UnknownDataProviderException(),
      );
      return null;
    }
  }

  void setBoarderId(String? boarderId) {
    state = state.copyWith(boarderId: boarderId);
  }

  // ---------- Search term handling ----------
  void changeSearchTerm(String value) {
    final isSearching = value.trim().isNotEmpty;
    state = state.copyWith(
      searchTerm: value,
      isSearching: isSearching,
      searchInvoices: isSearching ? state.searchInvoices : <InvoiceModel>[],
      exception: null,
    );
  }

  void reload() {
    if (state.isSearching) {
      search(reload: true);
    } else {
      fetch(reload: true);
    }
  }

  void clearSearch() {
    state = state.copyWith(
      searchTerm: '',
      isSearching: false,
      searchInvoices: <InvoiceModel>[],
      exception: null,
      hasMoreData: true,
    );
    fetch(reload: true);
  }

  // ---------- Fetch (paged) ----------
  Future<void> fetch({bool reload = false}) async {
    if (!reload && !state.hasMoreData) return;

    final barnId = ref.read(accountProvider).currentUser.barnId ?? '';
    state = state.copyWith(
      isLoading: true,
      exception: null,
      hasMoreData: reload ? true : state.hasMoreData,
    );

    try {
      final result = await _repository.fetchInvoices(
        barnId: barnId,
        reload: reload,
        boarderId: state.boarderId,
      );

      final noMore = result.isEmpty;

      final merged = reload
          ? result
          : <InvoiceModel>[
              ...state.invoices,
              ...result,
            ];

      state = state.copyWith(
        invoices: merged,
        isLoading: false,
        hasMoreData: !noMore,
      );
    } on DataProviderException catch (e) {
      state = state.copyWith(isLoading: false, exception: e);
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        exception: const UnknownDataProviderException(),
      );
    }
  }

  // ---------- Search ----------
  Future<void> search({String? searchTerm, bool reload = false}) async {
    final barnId = ref.read(accountProvider).currentUser.barnId ?? '';
    final term = (searchTerm ?? state.searchTerm).trim();

    if (term.isEmpty) {
      state = state.copyWith(
        searchTerm: '',
        isSearching: false,
        searchInvoices: <InvoiceModel>[],
        exception: null,
        hasMoreData: true,
      );
      return;
    }

    state = state.copyWith(
      searchTerm: term,
      isSearching: true,
      isLoading: true,
      exception: null,
    );

    try {
      final result = await _repository.fetchInvoices(
        barnId: barnId,
        reload: reload,
        boarderId: state.boarderId,
        searchTerm: term,
      );

      state = state.copyWith(
        searchInvoices: result,
        isLoading: false,
      );
    } on DataProviderException catch (e) {
      state = state.copyWith(isLoading: false, exception: e);
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        exception: const UnknownDataProviderException(),
      );
    }
  }

  // ---------- Mutations (helpers locales) ----------
  void addInvoice(InvoiceModel invoice) {
    final exists = state.invoices.any((i) => i.id == invoice.id);
    final newList = exists
        ? state.invoices.map((i) => i.id == invoice.id ? invoice : i).toList()
        : <InvoiceModel>[invoice, ...state.invoices];
    state = state.copyWith(invoices: newList);
  }

  void updateInvoice(InvoiceModel invoice) {
    final exists = state.invoices.any((i) => i.id == invoice.id);
    if (!exists) return;
    final newList = state.invoices
        .map((i) => i.id == invoice.id ? invoice : i)
        .toList();
    state = state.copyWith(invoices: newList);
  }

  void reset() => state = const FetchInvoicesState();

  /// Remove an invoice from both `invoices` and `searchInvoices` lists.
  void removeInvoice(InvoiceModel invoice) {
    final updatedInvoices = state.invoices
        .where((i) => i.id != invoice.id)
        .toList();

    final updatedSearchInvoices = state.searchInvoices
        .where((i) => i.id != invoice.id)
        .toList();

    state = state.copyWith(
      invoices: updatedInvoices,
      searchInvoices: updatedSearchInvoices,
    );
  }
}
