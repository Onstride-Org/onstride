import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class InvoicesChargesSection extends ConsumerStatefulWidget {
  const InvoicesChargesSection({super.key});

  @override
  ConsumerState<InvoicesChargesSection> createState() =>
      _InvoicesChargesSectionState();
}

class _InvoicesChargesSectionState
    extends ConsumerState<InvoicesChargesSection> {
  final List<TextEditingController> _amountCtrls = [];

  @override
  void dispose() {
    for (final c in _amountCtrls) {
      c.dispose();
    }
    super.dispose();
  }

  void _syncControllersWith(List<InvoiceCharge> charges) {
    while (_amountCtrls.length < charges.length) {
      final idx = _amountCtrls.length;
      _amountCtrls.add(
        TextEditingController(
          text: charges[idx].amount == 0
              ? ''
              : charges[idx].amount.formatWithDecimalsIfHas,
        ),
      );
    }
    while (_amountCtrls.length > charges.length) {
      _amountCtrls.removeLast().dispose();
    }
  }

  void _removeAt(int index, VoidCallback removeInProvider) {
    if (index >= 0 && index < _amountCtrls.length) {
      _amountCtrls.removeAt(index).dispose();
    }
    removeInProvider();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createEditInvoiceProvider);
    final notifier = ref.read(createEditInvoiceProvider.notifier);
    final l10n = context.l10n;

    _syncControllersWith(state.charges);

    return AnimatedSize(
      duration: kThemeAnimationDuration,
      alignment: Alignment.topCenter,
      child: Column(
        children: [
          ...List.generate(state.charges.length, (i) {
            final charge = state.charges[i];
            final amountCtrl = _amountCtrls[i];

            final expected = charge.amount == 0
                ? ''
                : charge.amount.formatWithDecimalsIfHas;
            if (amountCtrl.text != expected && !amountCtrl.selection.isValid) {
              amountCtrl.text = expected;
            }

            return Padding(
              padding: 12.edgeInsetsB,
              child: _InvoiceChargeRow(
                index: i,
                charge: charge,
                amountController: amountCtrl,
                onDescriptionChanged: (val) =>
                    notifier.setChargeDescription(i, val),
                onAmountChanged: (val) =>
                    notifier.setChargeAmount(i, double.tryParse(val) ?? 0),
                onRemove: () {
                  _removeAt(i, () {
                    notifier.removeChargeAt(i);
                  });
                  context.showSuccess(
                    title: context.l10n.itemRemoved,
                    action: AppSnackBarAction(
                      action: () {
                        notifier.addIndexedCharge(i, charge);
                        ScaffoldMessenger.of(context).clearSnackBars();
                      },
                      label: 'UNDO',
                    ),
                  );
                },
              ),
            );
          }),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: notifier.addEmptyCharge,
              style: GLButtonStyles.outlineM,
              child: Text(l10n.addCharge),
            ),
          ),
        ],
      ),
    );
  }
}

class _InvoiceChargeRow extends StatelessWidget {
  const _InvoiceChargeRow({
    required this.index,
    required this.charge,
    required this.amountController,
    required this.onDescriptionChanged,
    required this.onAmountChanged,
    required this.onRemove,
    super.key,
  });

  final int index;
  final InvoiceCharge charge;
  final TextEditingController amountController;
  final ValueChanged<String> onDescriptionChanged;
  final ValueChanged<String> onAmountChanged;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 6,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              FormLabel(l10n.items),
              GLSpaces.px8,
              GLDropdown<String>(
                key: ValueKey('dropdown_$index'),
                items: [
                  l10n.dailyFeeding,
                  l10n.hoofTrimming,
                  l10n.horseTransportation,
                  l10n.trainingSession,
                  l10n.vaccination,
                  l10n.woundCare,
                  l10n.other,
                ],
                selectedValue: charge.description.isEmpty
                    ? null
                    : charge.description,
                onChanged: onDescriptionChanged,
                itemBuilder: Text.new,
                selectedItemBuilder: Text.new,
                hintLabel: l10n.selectOption,
              ),
            ],
          ),
        ),
        GLSpaces.px12,
        Expanded(
          flex: 4,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              FormLabel(l10n.amount),
              GLSpaces.px8,
              TextFormField(
                key: ValueKey('amount_$index'),
                controller: amountController,
                onChanged: (value) {
                  onAmountChanged(value.replaceAll(',', '.'));
                },
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                validator: (text) {
                  final value = text?.replaceAll(',', '.');
                  final n = double.tryParse(value?.trim() ?? '');
                  if (n == null || n < 0) {
                    return l10n.amountInvalid;
                  }
                  return null;
                },
                decoration: const InputDecoration(
                  hintText: r'$',
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: 24.edgeInsetsT,
          child: IconButton(
            tooltip: l10n.remove,
            onPressed: onRemove,
            icon: const Icon(
              GLIcons.delete,
              color: GLColors.error500,
            ),
          ),
        ),
      ],
    );
  }
}
