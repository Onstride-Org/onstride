part of 'get_boarder_horses_provider.dart';

@freezed
sealed class GetBoarderHorsesState with _$GetBoarderHorsesState {
  const factory GetBoarderHorsesState.initial() = InitialGetBoarderHorsesState;

  const factory GetBoarderHorsesState.loading() = LoadingGetBoarderHorsesState;

  const factory GetBoarderHorsesState.success({
    required List<HorseModel> horses,
  }) = SuccessGetBoarderHorsesState;

  const factory GetBoarderHorsesState.error({
    required DataProviderException exception,
  }) = ErrorGetBoarderHorsesState;
}

extension GetBoarderHorsesExt on GetBoarderHorsesState {
  HorseModel? getHorseById(String id) {
    final state = this;
    if (state is SuccessGetBoarderHorsesState) {
      final i = state.horses.indexWhere((e) => e.id == id);
      return i != -1 ? state.horses[i] : null;
    }
    return null;
  }

  List<HorseModel> get allHorses {
    final state = this;
    if (state is SuccessGetBoarderHorsesState) {
      return state.horses;
    }
    return [];
  }
}
