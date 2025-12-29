part of 'barn_setup_provider.dart';

@freezed
sealed class BarnSetupState with _$BarnSetupState {
  const factory BarnSetupState({
    BarnShape? shape,
    BarnSetup? setup,
    BarnModel? barn,
    DataProviderException? exception,
    @Default(RequestStatus.initial) RequestStatus status,
  }) = _BarnSetupState;
}
