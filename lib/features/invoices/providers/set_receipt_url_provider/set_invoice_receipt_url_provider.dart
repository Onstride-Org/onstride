import 'package:data_provider_client/data_provider_client.dart';
import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:invoices_repository/invoices_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'set_invoice_receipt_url_provider.freezed.dart';
part 'set_invoice_receipt_url_provider.g.dart';
part 'set_invoice_receipt_url_state.dart';

@riverpod
class SetInvoiceReceiptUrl extends _$SetInvoiceReceiptUrl
    with ProviderGuardMixin {
  @override
  SetInvoiceReceiptUrlState build() =>
      const SetInvoiceReceiptUrlState.initial();

  InvoicesRepository get _repository => ref.read(invoicesRepositoryProvider);

  Future<void> setInvoiceReceiptUrl({
    required InvoiceModel invoice,
  }) async {
    await guard<InvoiceModel>(
      onStart: () => state = const SetInvoiceReceiptUrlState.loading(),
      action: () {
        final connectedAccountId = kDebugMode
            ? 'acct_1S6CRUJXwPWQy0bz'
            : ref.read(accountProvider).currentBarn?.connectedAccountId ?? '';
        return _repository.setInvoiceReceiptUrl(
          invoice: invoice,
          connectedAccountId: connectedAccountId,
        );
      },
      onSuccess: (data) => state = SetInvoiceReceiptUrlState.success(data),
      onException: (e) => state = SetInvoiceReceiptUrlState.error(e),
    );
  }
}
