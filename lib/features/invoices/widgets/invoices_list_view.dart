import 'package:app_ui/app_ui.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/invoices/invoices.dart';
import 'package:gl_horses/features/invoices/providers/delete_invoice/delete_invoice_provider.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';
import 'package:url_launcher/url_launcher_string.dart';

class InvoicesListView extends ConsumerWidget {
  const InvoicesListView({
    required this.invoices,
    required ScrollController scrollCtrl,
    super.key,
  }) : _scrollCtrl = scrollCtrl;

  final ScrollController _scrollCtrl;
  final List<InvoiceModel> invoices;

  void _deleteListener(
    BuildContext context,
    DeleteInvoiceState next,
    WidgetRef ref,
  ) {
    switch (next) {
      case InitialDeleteInvoiceState():
        return;
      case LoadingDeleteInvoiceState():
        return showInvisibleLoadingDialog(context);
      case SuccessDeleteInvoiceState():
        context.pop();
        ref.read(fetchInvoicesProvider.notifier).removeInvoice(next.invoice);
        return context.showSuccess(title: context.l10n.invoiceDeletedTitle);
      case ErrorDeleteInvoiceState():
        context.pop();
        if (next.exception is PermissionDeniedException) {
          ref.read(fetchInvoicesProvider.notifier).reload();
          return context.showError(
            title: next.exception.name(context.l10n),
            subtitle: context.l10n.deleteInvoiceForbiddenSubtitle,
          );
        }
        return context.showDataException(next.exception);
    }
  }

  void _payInvoiceListener(
    PayInvoiceState next,
    BuildContext context,
    WidgetRef ref,
  ) {
    switch (next) {
      case InitialPayInvoiceState():
        return;
      case LoadingPayInvoiceState():
        return showInvisibleLoadingDialog(context);
      case SuccessPayInvoiceState():
        context.pop();
        final status = next.invoice.status;
        context.showSuccess(
          title: status == InvoiceStatus.processing
              ? context.l10n.processingPayment
              : context.l10n.invoicesPaidSuccessTitle,
        );
        ref.read(fetchInvoicesProvider.notifier).updateInvoice(next.invoice);
      case ErrorPayInvoiceState():
        context.pop();
        context.showDataException(next.exception);
    }
  }

  void _setInvoiceReceiptUrl(
    SetInvoiceReceiptUrlState next,
    BuildContext context,
    WidgetRef ref,
  ) {
    switch (next) {
      case InitialSetInvoiceReceiptUrlState():
        return;
      case LoadingSetInvoiceReceiptUrlState():
        showInvisibleLoadingDialog(context);
      case SuccessSetInvoiceReceiptUrlState():
        context.pop();
        ref.read(fetchInvoicesProvider.notifier).updateInvoice(next.invoice);
        _launchUrl(next.invoice);
      case ErrorSetInvoiceReceiptUrlState():
        context.pop();
        context.showDataException(next.exception);
    }
  }

  void _launchUrl(InvoiceModel invoice) {
    launchUrlString(
      invoice.stripePaymentInfo!.receiptUrl!,
      mode: LaunchMode.inAppWebView,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref
      ..listen(
        deleteInvoiceProvider,
        (_, next) => _deleteListener(context, next, ref),
      )
      ..listen(
        payInvoiceProvider,
        (_, next) => _payInvoiceListener(next, context, ref),
      )
      ..listen(
        setInvoiceReceiptUrlProvider,
        (_, next) => _setInvoiceReceiptUrl(next, context, ref),
      );
    final user = ref.read(accountProvider).currentUser;
    return RefreshIndicator(
      onRefresh: () async => ref.read(fetchInvoicesProvider.notifier).reload(),
      child: ListView.separated(
        controller: _scrollCtrl,
        padding: 16.edgeInsetsA,
        itemCount: invoices.length,
        separatorBuilder: (_, __) => GLSpaces.px16,
        itemBuilder: (context, index) {
          final invoice = invoices[index];
          return GestureDetector(
            onTap: () {
              context.goNamed(
                user.isBoarder
                    ? InvoiceDetailViewScreen.name
                    : InvoiceDetailViewScreen.nameForHome,
                pathParameters: {
                  'id': invoice.id,
                  if (user.isBoarder) 'boarderId': invoice.boarderId,
                },
              );
            },
            child: InvoiceCard(
              invoice: invoice,
              onPay: () {
                context.goNamed(
                  user.isBoarder
                      ? InvoiceDetailViewScreen.name
                      : InvoiceDetailViewScreen.nameForHome,
                  pathParameters: {
                    'id': invoice.id,
                    if (user.isBoarder) 'boarderId': invoice.boarderId,
                  },
                );
              },
              // onPay: () => ref
              //     .read(payInvoiceProvider.notifier)
              //     .pay(
              //       invoice,
              //       GLPaymentMethod.ach,
              //     ),
              onSeeReceipt: () {
                if (invoice.stripePaymentInfo?.receiptUrl != null) {
                  _launchUrl(invoice);
                } else {
                  ref
                      .read(setInvoiceReceiptUrlProvider.notifier)
                      .setInvoiceReceiptUrl(invoice: invoice);
                }
              },
              onRetryPayment: () {},
              onDeleteInvoice: () async {
                final res = await ConfirmDialog.show(
                  context,
                  title: context.l10n.deleteInvoiceDialogTitle,
                  description: context.l10n.deleteInvoiceDialogDescription,
                );
                if (res != null && res) {
                  await ref
                      .read(deleteInvoiceProvider.notifier)
                      .deleteInvoice(invoice: invoice);
                }
              },
            ),
          );
        },
      ),
    );
  }
}
