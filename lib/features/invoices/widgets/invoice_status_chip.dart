import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class InvoiceStatusChip extends StatelessWidget {
  const InvoiceStatusChip({super.key, required this.invoice});

  final InvoiceModel invoice;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    final isPending = invoice.status == InvoiceStatus.pending;
    final isPaid = invoice.status == InvoiceStatus.paid;
    final isProcessing = invoice.status == InvoiceStatus.processing;
    final isFailed = invoice.status == InvoiceStatus.failed;
    final isOverdue = isPending && invoice.dueDate.isBefore(DateTime.now());

    final statusLabel = switch (invoice.status) {
      InvoiceStatus.paid => l10n.invoiceStatusPaid,
      InvoiceStatus.failed => l10n.invoiceStatusFailed, // 🔴 nuevo estado
      InvoiceStatus.processing => l10n.processing,
      InvoiceStatus.pending =>
        isOverdue ? l10n.statusOverdue : l10n.invoiceStatusPending,
      _ => l10n.invoiceStatusPending,
    };

    final (bgColor, textColor) = switch (invoice.status) {
      InvoiceStatus.paid => (GLColors.success50, GLColors.success800),
      InvoiceStatus.failed => (
        GLColors.error50,
        GLColors.error500,
      ), // 🔴 nuevo estilo
      InvoiceStatus.pending when isOverdue => (
        GLColors.error50,
        GLColors.error500,
      ),
      InvoiceStatus.pending => (GLColors.warning50, GLColors.warning500),
      InvoiceStatus.processing => (GLColors.warning50, GLColors.warning500),
      _ => (GLColors.neutral100, GLColors.neutral700),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        statusLabel,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ).copyWith(color: textColor),
      ),
    );
  }
}
