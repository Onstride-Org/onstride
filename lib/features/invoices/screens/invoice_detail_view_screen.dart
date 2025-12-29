import 'dart:developer';

import 'package:app_ui/app_ui.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/invoices/providers/delete_invoice/delete_invoice_provider.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';
import 'package:url_launcher/url_launcher_string.dart';

class InvoiceDetailViewScreen extends ConsumerStatefulWidget {
  const InvoiceDetailViewScreen({required this.invoiceId, super.key});

  static const path = 'invoice-detail/:id';
  static const name = 'invoice-detail';
  static const nameForHome = 'home-invoice-detail';

  final String invoiceId;

  @override
  ConsumerState<InvoiceDetailViewScreen> createState() =>
      _InvoiceDetailViewScreenState();
}

class _InvoiceDetailViewScreenState
    extends ConsumerState<InvoiceDetailViewScreen> {
  GLPaymentMethod _selectedMethod = GLPaymentMethod.ach;
  late final StripeFees fees;
  PaymentBreakdown? _cardGrossUp;
  PaymentBreakdown? _achGrossUp;

  @override
  void initState() {
    fees = StripeFees.fromJson(
      ref.read(remoteConfigClientProvider).getMap('all_fees'),
    );
    WidgetsBinding.instance.addPostFrameCallback(
      (timeStamp) {
        final invoice = ref
            .read(fetchInvoicesProvider)
            .getInvoiceById(widget.invoiceId);
        if (invoice != null) {
          _achGrossUp = computePaymentBreakdown(
            targetNetCents: invoice.subtotalCents,
            stripePercent: fees.stripeFeeAchPercent,
            stripePercentCapCents: fees.stripeFeeAchCapCents,
            stripeFixedCents: 0,
            platformPercent: fees.platformFeePercent,
            platformFixedCents: 0,
          );
          _cardGrossUp = computePaymentBreakdown(
            targetNetCents: invoice.subtotalCents,
            stripePercent: fees.stripeFeeCardPercent,
            stripeFixedCents: fees.stripeFeeCardFixedCents,
            platformPercent: fees.platformFeePercent,
            platformFixedCents: 0,
          );
          setState(() {});
        }
      },
    );
    super.initState();
  }

  PaymentBreakdown? _paramsFor(GLPaymentMethod m) {
    switch (m) {
      case GLPaymentMethod.ach:
        return _achGrossUp;
      case GLPaymentMethod.card:
        return _cardGrossUp;
    }
  }

  void _onPayNow(InvoiceModel invoice) {
    final breakdown = _paramsFor(_selectedMethod)!;
    ref
        .read(payInvoiceProvider.notifier)
        .pay(
          invoice: invoice.copyWith(paymentBreakdown: breakdown),
          method: _selectedMethod,
          paymentBreakdown: breakdown,
        );
  }

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
        context.showSuccess(title: context.l10n.invoiceDeletedTitle);
        return context.pop();
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

  void _seeReceipt(InvoiceModel invoice) {
    if (invoice.stripePaymentInfo?.receiptUrl != null) {
      _launchUrl(invoice);
    } else {
      ref
          .read(setInvoiceReceiptUrlProvider.notifier)
          .setInvoiceReceiptUrl(invoice: invoice);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final invoice = ref
        .watch(fetchInvoicesProvider)
        .getInvoiceById(widget.invoiceId);

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

    if (invoice == null) {
      return Scaffold(
        appBar: AppBar(leading: const BackButton()),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final itemsLabel = l10n.items;
    final paymentBreakdown =
        invoice.paymentBreakdown ?? _paramsFor(_selectedMethod);
    log('${paymentBreakdown?.pretty()}');
    final items = invoice.charges;
    final serviceFeeCents =
        (paymentBreakdown?.stripeFeeCents ?? 0) +
        (paymentBreakdown?.platformFeeCents ?? 0);
    final totalToPay = serviceFeeCents + invoice.subtotalCents;
    final user = ref.watch(accountProvider).currentUser;
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: Text('${l10n.invoicesTitle} #${invoice.id}'),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: [24, 16].edgeInsetsHV.copyWith(top: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (invoice.status.isProcessing) ...[
                    Align(
                      alignment: Alignment.centerRight,
                      child: InvoiceStatusChip(invoice: invoice),
                    ),
                  ],
                  if (invoice.status.isFailed) ...[
                    AppSnackBar.error(
                      title: user.isBoarder
                          ? 'Your payment failed'
                          : 'Payment failed',
                      subtitle: invoice.stripePaymentInfo?.lastError,
                      showClose: false,
                    ),
                    GLSpaces.px12,
                  ],
                  for (final c in items) ...[
                    ChargeTile(
                      description: c.description,
                      quantity: c.quantity,
                      amount: c.amount,
                    ),
                    GLSpaces.px12,
                  ],
                  GLSpaces.px12,
                  if (invoice.canPay) ...[
                    Text(l10n.paymentMethod, style: context.titleLarge),
                    GLSpaces.px12,
                    PaymentMethodRadioButton(
                      selected: _selectedMethod == GLPaymentMethod.ach,
                      title: 'ACH - Direct Debit',
                      subtitle:
                          'Fee: ${_achGrossUp?.stripePercentOverTarget.toPercent}% (max. \$5)',
                      onTap: () {
                        if (_selectedMethod != GLPaymentMethod.ach) {
                          _selectedMethod = GLPaymentMethod.ach;
                          setState(() {});
                        }
                      },
                    ),
                    GLSpaces.px8,
                    PaymentMethodRadioButton(
                      selected: _selectedMethod == GLPaymentMethod.card,
                      title: 'Credit/Debit Card',
                      subtitle:
                          'Fee: ${_cardGrossUp?.stripePercentOverTarget.toPercent}%',
                      onTap: () {
                        if (_selectedMethod != GLPaymentMethod.card) {
                          _selectedMethod = GLPaymentMethod.card;
                          setState(() {});
                        }
                      },
                    ),
                  ],
                ],
              ),
            ),
          ),

          Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Color(0x05000000),
                  blurRadius: 10,
                  offset: Offset(0, -10),
                ),
              ],
            ),
            padding: 20.edgeInsetsH,
            child: Column(
              children: [
                GLSpaces.px12,
                if (!invoice.status.isPending) ...[
                  PaymentMethodTile(stripeInfo: invoice.stripePaymentInfo),
                ],
                SummaryRow(
                  label: itemsLabel,
                  value: invoice.subtotalUsd.formatWithDecimalsIfHas,
                ),
                GLSpaces.px8,

                if (!invoice.status.isPending) ...[
                  SummaryRowWithTooltip(
                    label: 'Payment Fee',
                    value: '\$${invoice.paymentFee.formatWithDecimalsIfHas}',
                    tooltip: 'This fee covers payment processing.',
                  ),
                  GLSpaces.px8,
                  SummaryRowWithTooltip(
                    label: 'Platform Fee',
                    value: '\$${invoice.platformFee.formatWithDecimalsIfHas}',
                    tooltip:
                        'This fee helps us keep the platform up and running.',
                  ),
                ],
                if (invoice.status.isPending) ...[
                  SummaryRowWithTooltip(
                    label: 'Service Fee',
                    value:
                        '\$${(serviceFeeCents / 100).formatWithDecimalsIfHas}',
                    tooltip:
                        'This fee covers payment processing and platform maintenance costs.',
                  ),
                ],
                GLSpaces.px24,
              ],
            ),
          ),
          _PayFooter(
            invoice: invoice,
            totalToPay: totalToPay,
            onPayNow: () => _onPayNow(invoice),
            onSeeReceipt: () => _seeReceipt(invoice),
            onDelete: () async {
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
            onEdit: () async {
              final res = await context.pushNamed(
                CreateEditInvoiceScreen.name,
                extra: invoice,
              );
              if (res is InvoiceModel && context.mounted) {
                context.showSuccess(title: context.l10n.invoiceUpdated);
              }
            },
          ),
        ],
      ),
    );
  }
}

class _PayFooter extends ConsumerWidget {
  const _PayFooter({
    required this.invoice,
    required this.totalToPay,
    required this.onPayNow,
    required this.onSeeReceipt,
    required this.onDelete,
    required this.onEdit,
  });

  final InvoiceModel invoice;
  final int totalToPay;
  final VoidCallback onPayNow;
  final VoidCallback onSeeReceipt;
  final VoidCallback onDelete;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(accountProvider).currentUser;

    final totalAmountFixed = (totalToPay / 100).formatWithDecimalsIfHas;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: SafeArea(
        top: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            GLSpaces.px4,

            Row(
              children: [
                Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GLSpaces.px8,
                      Expanded(
                        child: Text(
                          invoice.status.isPaid
                              ? 'Total amount paid'
                              : 'Total amount to pay',
                          style: GLTextStyles.bodyLarge.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      GLSpaces.px4,
                      Text(
                        '\$$totalAmountFixed',
                        style: GLTextStyles.bodyLarge,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (user.isBoarder && invoice.status.isPaid) ...[
              GLSpaces.px12,
              ElevatedButton(
                onPressed: onSeeReceipt,
                style: GLButtonStyles.primaryS,
                child: Text(context.l10n.seeReceiptLabel),
              ),
            ],
            if ((user.isBoarder) &&
                [
                  InvoiceStatus.pending,
                  InvoiceStatus.failed,
                ].contains(invoice.status)) ...[
              GLSpaces.px12,
              ElevatedButton(
                onPressed: onPayNow,
                style: GLButtonStyles.primaryS,
                child: Text(
                  invoice.status.isFailed
                      ? '${context.l10n.retryPaymentLabel} \$$totalAmountFixed'
                      : '${context.l10n.payInvoicelabel} \$$totalAmountFixed',
                ),
              ),
            ],
            if ((user.isOwner || user.canGenerateInvoices) &&
                invoice.status == InvoiceStatus.pending) ...[
              GLSpaces.px12,
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onEdit,
                      style: GLButtonStyles.outlineS,
                      icon: const Icon(GLIcons.edit),
                      label: Text(context.l10n.edit),
                    ),
                  ),
                  GLSpaces.px12,
                  Expanded(
                    child: TextButton.icon(
                      onPressed: onDelete,
                      style: GLButtonStyles.errorLinkS,
                      icon: const Icon(GLIcons.delete),
                      label: Text(context.l10n.delete),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Internal DTO for fee parameters.
/// Replace later by your Remote Config source.
// class FeeParams {
//   const FeeParams({
//     required this.stripePercent,
//     required this.stripeFixedCents,
//     required this.stripeTaxPercent,
//     required this.stripePercentCapCents,
//     required this.platformPercent,
//   });
//
//   factory FeeParams.card() => const FeeParams(
//     stripePercent: 0.029,
//     stripeFixedCents: 30,
//     stripeTaxPercent: 0,
//     stripePercentCapCents: null,
//     platformPercent: 0.005,
//   ); // e.g., 0
//
//   factory FeeParams.ach({
//     double stripeAchPercent = 0.008,
//     int stripePercentCapCents = 500,
//   }) => FeeParams(
//     stripePercent: stripeAchPercent,
//     stripeFixedCents: 0,
//     stripeTaxPercent: 0,
//     stripePercentCapCents: stripePercentCapCents,
//     platformPercent: 0.005,
//   ); // e.g., 0
//
//   final double stripePercent; // e.g., 0.029
//   final int stripeFixedCents; // e.g., 30
//   final double stripeTaxPercent; // e.g., 0.16 (VAT)
//   final int? stripePercentCapCents; // e.g., 500 for $5 cap; null if none
//   final double platformPercent; // e.g., 0.005
// }
