part of 'set_barn_name_provider.dart';

@freezed
sealed class SetBarnNameState with _$SetBarnNameState {
  const factory SetBarnNameState.initial() = InitialSetBarnNameState;

  const factory SetBarnNameState.loading() = LoadingSetBarnNameState;

  const factory SetBarnNameState.success({required BarnModel barn}) =
      SuccessSetBarnNameState;

  const factory SetBarnNameState.error({
    required DataProviderException exception,
  }) = ErrorSetBarnNameState;
}
