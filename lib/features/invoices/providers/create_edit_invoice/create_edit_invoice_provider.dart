import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/gen_l10n/app_localizations.dart';
import 'package:invoices_repository/invoices_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'create_edit_invoice_provider.freezed.dart';
part 'create_edit_invoice_provider.g.dart';
part 'create_edit_invoice_state.dart';

@riverpod
class CreateEditInvoice extends _$CreateEditInvoice with ProviderGuardMixin {
  InvoicesRepository get _repository => ref.read(invoicesRepositoryProvider);

  @override
  CreateEditInvoiceState build() => const CreateEditInvoiceState();

  void initForEdit(InvoiceModel invoice) {
    state = state.copyWith(
      invoice: invoice,
      boarder: ref.read(fetchUsersProvider).getUserById(invoice.boarderId),
      horse: ref.read(fetchHorsesProvider).getHorseById(invoice.horseId),
      dueDate: invoice.dueDate,
      charges: List<InvoiceCharge>.from(invoice.charges),
      status: RequestStatus.initial,
    );
  }

  // ----------------- setters -----------------

  void setBoarder(GLUser? u) {
    state = state.copyWith(boarder: u, horse: null);
  }

  void setHorse(HorseModel? h) {
    state = state.copyWith(horse: h);
  }

  void setDueDate(DateTime? date) {
    state = state.copyWith(dueDate: date);
  }

  // ----------------- charges API -----------------
  void addIndexedCharge(int index, InvoiceCharge charge) {
    final list = List<InvoiceCharge>.from(state.charges)..add(charge);
    state = state.copyWith(charges: list);
  }

  void addEmptyCharge() {
    final list = List<InvoiceCharge>.from(state.charges)
      ..add(
        const InvoiceCharge(description: ''),
      );
    state = state.copyWith(charges: list);
  }

  void removeChargeAt(int index) {
    if (index < 0 || index >= state.charges.length) return;
    final list = List<InvoiceCharge>.from(state.charges)..removeAt(index);
    state = state.copyWith(charges: list);
  }

  void setChargeDescription(int index, String description) {
    if (index < 0 || index >= state.charges.length) return;
    final c = state.charges[index].copyWith(description: description);
    final list = List<InvoiceCharge>.from(state.charges)..[index] = c;
    state = state.copyWith(charges: list);
  }

  void setChargeAmount(int index, double amount) {
    if (index < 0 || index >= state.charges.length) return;
    final safe = amount.isFinite && amount >= 0 ? amount : 0.0;
    final c = state.charges[index].copyWith(amount: safe);
    final list = List<InvoiceCharge>.from(state.charges)..[index] = c;
    state = state.copyWith(charges: list);
  }

  void setChargeQuantity(int index, int quantity) {
    if (index < 0 || index >= state.charges.length) return;
    final q = quantity > 0 ? quantity : 1;
    final c = state.charges[index].copyWith(quantity: q);
    final list = List<InvoiceCharge>.from(state.charges)..[index] = c;
    state = state.copyWith(charges: list);
  }

  // ----------------- derived -----------------

  double get total {
    return state.charges.fold<double>(
      0,
      (sum, c) => sum + (c.amount * c.quantity),
    );
  }

  // ----------------- validation -----------------

  InvoiceValidationError? validate() {
    if (state.boarder == null) return InvoiceValidationError.boarderRequired;
    if (state.horse == null) return InvoiceValidationError.horseRequired;
    if (state.dueDate == null) return InvoiceValidationError.dueDateRequired;
    if (state.charges.isEmpty) return InvoiceValidationError.chargesRequired;

    for (final c in state.charges) {
      if (c.description.trim().isEmpty) {
        return InvoiceValidationError.chargeDescriptionRequired;
      }
      if (c.amount.isNaN || c.amount <= 0) {
        return InvoiceValidationError.chargeAmountInvalid;
      }
      if (c.quantity <= 0) {
        return InvoiceValidationError.chargeQuantityInvalid;
      }
    }

    return null;
  }

  Future<void> submit() async {
    final error = validate();
    if (error != null) {
      return;
    }

    await guard<InvoiceModel>(
      onStart: () => state = state.copyWith(status: RequestStatus.loading),
      action: () async {
        final me = ref.read(accountProvider).currentUser;
        final barnId = me.barnId ?? '';
        final boarder = state.boarder!;
        final horse = state.horse!;
        final dueDate = state.dueDate!;
        final charges = state.charges;
        final fees = StripeFees.fromJson(
          ref.read(remoteConfigClientProvider).getMap('all_fees'),
        );
        final req = InvoiceRequest(
          barnId: barnId,
          boarderId: boarder.id,
          horseId: horse.id,
          horseName: horse.name,
          boarderName: boarder.name ?? '',
          allFees: fees,
          dueDate: dueDate,
          createdById: me.id,
          charges: charges,
          searchTerms: [
            state.horse!.name,
            state.boarder!.name ?? '',
            me.name ?? '',
          ],
          status: state.invoice?.status ?? InvoiceStatus.pending,
        );

        if (state.invoice == null) {
          return _repository.createInvoice(req);
        } else {
          return _repository.editInvoice(state.invoice!, req);
        }
      },
      onSuccess: (data) => state = state.copyWith(
        invoice: data,
        status: RequestStatus.success,
      ),
      onException: (e) {
        state = state.copyWith(
          exception: e,
          status: RequestStatus.error,
        );
      },
    );
  }

  void reset() => state = const CreateEditInvoiceState();
}
