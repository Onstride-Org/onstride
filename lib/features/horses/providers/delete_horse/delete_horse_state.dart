part of 'delete_horse_provider.dart';

@freezed
sealed class DeleteHorseState with _$DeleteHorseState {
  const factory DeleteHorseState.initial() = InitialDeleteHorseState;

  const factory DeleteHorseState.loading() = LoadingDeleteHorseState;

  const factory DeleteHorseState.success(HorseModel horse) =
      SuccessDeleteHorseState;

  const factory DeleteHorseState.error(DataProviderException exception) =
      ErrorDeleteHorseState;
}
