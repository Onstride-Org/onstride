import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class InvoiceCard extends ConsumerWidget {
  const InvoiceCard({
    required this.invoice,
    super.key,
    this.onPay,
    this.onSeeReceipt,
    this.onRetryPayment,
    this.onDeleteInvoice,
    this.code,
  });

  /// Domain model
  final InvoiceModel invoice;

  /// Optional UI code/number (fallback uses invoice.id short)
  final String? code;

  /// Actions
  final void Function()? onPay;
  final void Function()? onSeeReceipt;
  final void Function()? onRetryPayment;
  final void Function()? onDeleteInvoice;

  String formatAmount(double amount) {
    if (amount % 1 == 0) {
      return amount.toInt().toString();
    } else {
      return amount.toStringAsFixed(2);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final usersState = ref.watch(fetchUsersProvider);
    final horsesState = ref.watch(fetchHorsesProvider);
    final boarderName = usersState.getUserById(invoice.boarderId)?.name;
    final horseName = horsesState.getHorseById(invoice.horseId)?.name;
    final currentUser = ref.watch(accountProvider).currentUser;
    final isPending = invoice.status == InvoiceStatus.pending;
    final isFailed = invoice.status == InvoiceStatus.failed;
    final isPaid = invoice.status == InvoiceStatus.paid;
    final isOverdue =
        invoice.status == InvoiceStatus.pending &&
        invoice.dueDate.isBefore(DateTime.now());
    final amount = invoice.subtotalCents;
    final displayCode = invoice.id;

    return Container(
      padding: 16.edgeInsetsA,
      decoration: BoxDecoration(
        borderRadius: 12.borderRadiusA,
        border: Border.all(color: Colors.grey.shade200),
        color: Colors.white,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '\$${formatAmount(amount / 100)}',
                style: TextStyle(
                  fontSize: 20.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              InvoiceStatusChip(invoice: invoice),
            ],
          ),
          GLSpaces.px4,
          FittedBox(
            child: Text(
              displayCode,
              style: const TextStyle(color: Colors.grey),
            ),
          ),
          GLSpaces.px12,
          Row(
            children: [
              if (!currentUser.isBoarder) ...[
                const Icon(Icons.person, size: 16, color: Colors.grey),
                GLSpaces.px4,
                Flexible(
                  child: Text(
                    boarderName ?? '',
                    style: const TextStyle(color: Colors.grey),
                    maxLines: 2,
                  ),
                ),
                GLSpaces.px12,
              ],
              const Icon(
                GLIcons.horseshoefill_1,
                size: 16,
                color: Colors.grey,
                blendMode: BlendMode.difference,
              ),
              GLSpaces.px4,
              Flexible(
                child: Text(
                  horseName ?? '',
                  maxLines: 2,
                  style: const TextStyle(color: Colors.grey),
                ),
              ),
            ],
          ),
          GLSpaces.px8,
          Text(
            '${l10n.dateIssuedLabel} : ${_formatDate(invoice.createdAt)}',
            style: const TextStyle(color: Colors.grey),
          ),
          Text(
            '${l10n.dateDueLabel} : ${_formatDate(invoice.dueDate)}',
            style: const TextStyle(color: Colors.grey),
          ),
          GLSpaces.px12,
          if (isPending &&
              (currentUser.isOwner || currentUser.canGenerateInvoices))
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: () async {
                    final res = await context.pushNamed(
                      CreateEditInvoiceScreen.name,
                      extra: invoice,
                    );
                    if (res is InvoiceModel && context.mounted) {
                      context.showSuccess(title: context.l10n.invoiceUpdated);
                    }
                  },
                  style: GLButtonStyles.outlineXS,
                  icon: const Icon(GLIcons.edit),
                  label: Text(l10n.edit),
                ),
                TextButton.icon(
                  onPressed: onDeleteInvoice,
                  style: GLButtonStyles.errorLinkXS,
                  icon: const Icon(GLIcons.delete),
                  label: Text(l10n.delete),
                ),
              ],
            ),
          if (currentUser.isBoarder) ...[
            if (isPending || isOverdue || isFailed)
              ElevatedButton(
                onPressed: onPay,
                style: GLButtonStyles.primaryXS,
                child: Text(
                  isFailed ? l10n.retryPaymentLabel : l10n.payNowLabel,
                ),
              ),
            if (isPaid)
              OutlinedButton(
                onPressed: onSeeReceipt,
                style: GLButtonStyles.outlineXS,
                child: Text(l10n.seeReceiptLabel),
              ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${_monthName(date.month)} ${date.day}, ${date.year}';
  }

  String _monthName(int month) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  }
}
