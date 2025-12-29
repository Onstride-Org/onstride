part of 'fetch_horses_provider.dart';

@freezed
sealed class FetchHorsesState with _$FetchHorsesState {
  const factory FetchHorsesState({
    @Default([]) List<HorseModel> horses,
    @Default([]) List<HorseModel> searchHorses,
    @Default('') String searchTerm,
    @Default(false) bool isSearching,
    @Default(true) bool hasMoreData,
    @Default(false) bool isLoading,
    DataProviderException? exception,
  }) = _FetchHorsesState;
}

extension FetchHorsesStateExt on FetchHorsesState {
  HorseModel? getHorseById(String? id) {
    if (id == null) return null;
    final list = isSearching ? searchHorses : horses;
    if (list.isEmpty) return null;
    for (final h in list) {
      if (h.id == id) return h;
    }
    return null;
  }
}
