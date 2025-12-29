part of 'delete_account_provider.dart';

@freezed
sealed class DeleteAccountState with _$DeleteAccountState {
  const factory DeleteAccountState.initial() = InitialDeleteAccountState;

  const factory DeleteAccountState.loading() = LoadingDeleteAccountState;

  const factory DeleteAccountState.success() = SuccessDeleteAccountState;

  const factory DeleteAccountState.error({
    required DataProviderException exception,
  }) = ErrorDeleteAccountState;

  const factory DeleteAccountState.authenticationError() =
      AuthenticationErrorDeleteAccountState;

  const factory DeleteAccountState.prevented({
    required DeleteAccountPreventionReason reason,
  }) = PreventedDeleteAccountState;
}
