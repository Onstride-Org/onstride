part of 'load_horses_options_provider.dart';

@freezed
sealed class LoadHorsesOptionsState with _$LoadHorsesOptionsState {
  const factory LoadHorsesOptionsState.initial() =
      InitialLoadHorsesOptionsState;

  const factory LoadHorsesOptionsState.loading() =
      LoadingLoadHorsesOptionsState;

  const factory LoadHorsesOptionsState.success({
    required List<HorseBreed> breeds,
    required List<HorseSexStatus> sexStatus,
  }) = SuccessLoadHorsesOptionsState;

  const factory LoadHorsesOptionsState.error({
    required DataProviderException exception,
  }) = ErrorLoadHorsesOptionsState;
}

extension HorseOptionExt on LoadHorsesOptionsState {
  List<HorseBreed> get breeds {
    if (this is SuccessLoadHorsesOptionsState) {
      return (this as SuccessLoadHorsesOptionsState).breeds;
    }
    return [];
  }

  List<HorseSexStatus> get sexStatus {
    if (this is SuccessLoadHorsesOptionsState) {
      return (this as SuccessLoadHorsesOptionsState).sexStatus;
    }
    return [];
  }
}
