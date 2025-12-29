import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/invoices/widgets/create_edit/invoice_summary_section.dart';
import 'package:gl_horses/features/invoices/widgets/create_edit/widgets.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class CreateEditInvoiceScreen extends ConsumerStatefulWidget {
  const CreateEditInvoiceScreen({super.key, this.invoice});

  final InvoiceModel? invoice;

  static String name = 'invoice-editor';
  static String path = 'invoice-editor';

  @override
  ConsumerState<CreateEditInvoiceScreen> createState() =>
      _CreateEditInvoicePageState();
}

class _CreateEditInvoicePageState
    extends ConsumerState<CreateEditInvoiceScreen> {
  final _formKey = GlobalKey<FormState>();
  final _dueDateCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.invoice != null) {
        ref
            .read(createEditInvoiceProvider.notifier)
            .initForEdit(widget.invoice!);
        _dueDateCtrl.text = widget.invoice!.dueDate.mmDdYy;
      }
      ref.read(fetchUsersProvider.notifier).fetchAllUsers();
      ref.read(fetchHorsesProvider.notifier).fetchAllHorses();
    });
  }

  @override
  void dispose() {
    _dueDateCtrl.dispose();
    super.dispose();
  }

  void _onSave() {
    final l10n = context.l10n;
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final error = ref.read(createEditInvoiceProvider.notifier).validate();
    if (error != null) {
      context.showError(
        title: l10n.pleaseCompleteAllFields,
        subtitle: error.toMessage(context.l10n),
      );
      return;
    }
    ref.read(createEditInvoiceProvider.notifier).submit();
  }

  void _statusListener(
    CreateEditInvoiceState? previous,
    CreateEditInvoiceState next,
  ) {
    switch (next.status) {
      case RequestStatus.initial:
        return;
      case RequestStatus.loading:
        return showInvisibleLoadingDialog(context);
      case RequestStatus.success:
        context.pop();
        if (widget.invoice == null) {
          ref.watch(fetchInvoicesProvider.notifier).addInvoice(next.invoice!);
        } else {
          ref
              .watch(fetchInvoicesProvider.notifier)
              .updateInvoice(next.invoice!);
        }
        return context.pop(next.invoice);
      case RequestStatus.error:
        context.pop();
        return context.showDataException(next.exception!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final state = ref.watch(createEditInvoiceProvider);
    final notifier = ref.read(createEditInvoiceProvider.notifier);
    ref.listen(createEditInvoiceProvider, _statusListener);
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          state.invoice == null ? l10n.createInvoice : l10n.editInvoice,
          style: context.titleLarge,
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding:
              (24.edgeInsetsH + 16.edgeInsetsV) +
              EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              FormLabel(l10n.boarder),
              GLSpaces.px8,
              BoarderSelector(
                boarder: state.boarder,
                onChanged: notifier.setBoarder,
              ),
              GLSpaces.px16,
              FormLabel(l10n.horse),
              GLSpaces.px8,
              HorseSelector(
                boarderId: state.boarder?.id,
                horse: state.horse,
                onChanged: notifier.setHorse,
              ),
              GLSpaces.px16,
              FormLabel(l10n.dueDate),
              GLSpaces.px8,
              TextFormField(
                onTap: () async {
                  final date = await GLCalendarDatePicker.show(
                    context,
                    minDate: DateTime.now(),
                    initialDate: DateTime.now(),
                    maxDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (date == null) return;
                  notifier.setDueDate(date.copyWith(hour: 23));
                  _dueDateCtrl.text = date.mmDdYy;
                },
                readOnly: true,
                controller: _dueDateCtrl,
                decoration: const InputDecoration(
                  hintText: 'MM/DD/YYYY',
                  suffixIcon: Icon(GLIcons.calendar),
                ),
                validator: (value) => FormValidator.noEmpty(
                  value,
                  emptyMessage: l10n.dueDateRequired,
                ),
              ),
              GLSpaces.px24,
              Text(l10n.addCharges, style: context.titleLarge),
              GLSpaces.px12,
              const InvoicesChargesSection(),
              GLSpaces.px24,
              const InvoicesSummarySection(),
              GLSpaces.px24,
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => context.pop(),
                      style: GLButtonStyles.outlineM,
                      child: Text(l10n.cancel),
                    ),
                  ),
                  GLSpaces.px16,
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _onSave,
                      style: GLButtonStyles.primaryM,
                      child: Text(
                        l10n.save,
                        style: context.labelLarge.copyWith(color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
              GLSpaces.px40,
            ],
          ),
        ),
      ),
    );
  }
}
