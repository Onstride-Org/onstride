part of 'complete_account_provider.dart';

@freezed
sealed class CompleteAccountState with _$CompleteAccountState {
  const factory CompleteAccountState.initial() = InitialCompleteAccountState;

  const factory CompleteAccountState.loading() = LoadingCompleteAccountState;

  const factory CompleteAccountState.success({required GLUser user}) =
      SuccessCompleteAccountState;

  const factory CompleteAccountState.error({
    required DataProviderException exception,
  }) = ErrorCompleteAccountState;
}
