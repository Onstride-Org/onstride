import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';

class InvoicesSummarySection extends ConsumerWidget {
  const InvoicesSummarySection({super.key});

  String formatAmount(double amount) {
    if (amount % 1 == 0) {
      return amount.toInt().toString();
    } else {
      return amount.toStringAsFixed(2);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(createEditInvoiceProvider);
    final total = state.charges.fold<double>(
      0,
      (sum, c) => sum + (c.amount * c.quantity),
    );
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(l10n.invoiceSummary, style: context.titleLarge),
        GLSpaces.px12,
        for (final c in state.charges) ...[
          _SummaryRow(
            label: c.description,
            value: formatAmount(c.amount),
          ),
          GLSpaces.px8,
        ],
        GLSpaces.px8,
        _SummaryRow(
          label: l10n.totalAmount,
          value: formatAmount(total),
          emphasize: true,
        ),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.emphasize = false,
  });

  final String label;
  final String value;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    final styleLabel = emphasize ? context.titleMedium : context.bodyLarge;
    final styleValue = emphasize ? context.titleMedium : context.bodyLarge;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: styleLabel),
        Text('\$$value', style: styleValue),
      ],
    );
  }
}
