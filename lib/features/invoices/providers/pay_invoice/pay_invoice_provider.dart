import 'package:data_provider_client/data_provider_client.dart';
import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:invoices_repository/invoices_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'pay_invoice_provider.freezed.dart';
part 'pay_invoice_provider.g.dart';
part 'pay_invoice_state.dart';

@riverpod
class PayInvoice extends _$PayInvoice with ProviderGuardMixin {
  InvoicesRepository get _repository => ref.read(invoicesRepositoryProvider);

  Future<void> pay({
    required InvoiceModel invoice,
    required PaymentBreakdown paymentBreakdown,
    required GLPaymentMethod method,
  }) async {
    await guard<InvoiceModel>(
      onStart: () => state = const LoadingPayInvoiceState(),
      action: () async {
        final connectedAccountId = kDebugMode
            ? 'acct_1S6CRUJXwPWQy0bz'
            : ref.read(accountProvider).currentBarn?.connectedAccountId ?? '';

        if (connectedAccountId.isEmpty) {
          throw const NotFoundBarnException();
        }
        return _repository.payInvoice(
          invoice: invoice,
          paymentBreakdown: paymentBreakdown,
          method: method,
          connectedAccountId: connectedAccountId,
        );
      },

      onSuccess: (data) => state = SuccessPayInvoiceState(
        invoice: data,
      ),
      onException: (e) => state = ErrorPayInvoiceState(exception: e),
    );
  }

  @override
  PayInvoiceState build() => const PayInvoiceState.initial();
}
