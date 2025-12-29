part of 'create_edit_invoice_provider.dart';

@freezed
sealed class CreateEditInvoiceState with _$CreateEditInvoiceState {
  const factory CreateEditInvoiceState({
    InvoiceModel? invoice,
    GLUser? boarder,
    HorseModel? horse,
    DateTime? dueDate,
    @Default(RequestStatus.initial) RequestStatus status,
    DataProviderException? exception,
    @Default([]) List<InvoiceCharge> charges,
  }) = _CreateEditInvoiceState;
}

enum InvoiceValidationError {
  boarderRequired,
  horseRequired,
  dueDateRequired,
  chargesRequired,
  chargeDescriptionRequired,
  chargeAmountInvalid,
  chargeQuantityInvalid,
}

extension InvoiceValidationErrorX on InvoiceValidationError {
  String toMessage(AppLocalizations l10n) {
    switch (this) {
      case InvoiceValidationError.boarderRequired:
        return l10n.boarderRequired;
      case InvoiceValidationError.horseRequired:
        return l10n.horseRequired;
      case InvoiceValidationError.dueDateRequired:
        return l10n.dueDateRequired;
      case InvoiceValidationError.chargesRequired:
        return l10n.chargesRequired;
      case InvoiceValidationError.chargeDescriptionRequired:
        return l10n.chargeDescriptionRequired;
      case InvoiceValidationError.chargeAmountInvalid:
        return l10n.chargeAmountInvalid;
      case InvoiceValidationError.chargeQuantityInvalid:
        return l10n.chargeQuantityInvalid;
    }
  }
}
