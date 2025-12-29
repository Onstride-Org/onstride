import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:horse_repository/horse_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fetch_horses_provider.freezed.dart';
part 'fetch_horses_provider.g.dart';
part 'fetch_horses_state.dart';

@Riverpod(keepAlive: true)
class FetchHorses extends _$FetchHorses {
  HorseRepository get _repository => ref.read(horseRepositoryProvider);

  @override
  FetchHorsesState build() => const FetchHorsesState();

  void changeSearchTerm(String value) {
    final isSearching = value.trim().isNotEmpty;
    state = state.copyWith(
      searchTerm: value,
      isSearching: isSearching,
      searchHorses: isSearching ? state.searchHorses : <HorseModel>[],
      exception: null,
    );
  }

  void reload() {
    if (state.isSearching) {
      search(reload: true);
    } else {
      fetch(reload: true);
    }
  }

  void clearSearch() {
    state = state.copyWith(
      searchTerm: '',
      isSearching: false,
      searchHorses: <HorseModel>[],
      exception: null,
      hasMoreData: true,
    );
  }

  Future<void> fetch({
    bool reload = false,
  }) async {
    if (!reload && !state.hasMoreData) return;

    final barnId = ref.read(accountProvider).currentUser.barnId ?? '';
    state = state.copyWith(
      isLoading: true,
      exception: null,
      hasMoreData: reload ? true : state.hasMoreData,
    );

    try {
      final result = await _repository.fetchHorses(
        barnId: barnId,
        reload: reload,
      );

      final noMore = result.isEmpty;

      var mergedResults = <HorseModel>[];

      if (reload) {
        mergedResults = result;
      } else {
        final currentHorsesMap = {
          for (final horse in state.horses) horse.id: horse,
        };

        for (final horse in result) {
          currentHorsesMap[horse.id] = horse;
        }

        mergedResults = currentHorsesMap.values.toList();
      }

      state = state.copyWith(
        horses: mergedResults,
        isLoading: false,
        hasMoreData: noMore ? false : true,
      );

      ref.read(fetchUsersProvider.notifier).loadByHorses(mergedResults);
    } on DataProviderException catch (e) {
      state = state.copyWith(isLoading: false, exception: e);
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        exception: const UnknownDataProviderException(),
      );
    }
  }

  Future<void> search({
    String? searchTerm,
    bool reload = false,
  }) async {
    final barnId = ref.read(accountProvider).currentUser.barnId ?? '';
    final term = (searchTerm ?? state.searchTerm).trim();

    if (term.isEmpty) {
      state = state.copyWith(
        searchTerm: '',
        isSearching: false,
        searchHorses: <HorseModel>[],
        exception: null,
        hasMoreData: true,
      );
      return;
    }

    state = state.copyWith(
      searchTerm: term,
      isSearching: true,
      isLoading: true,
      exception: null,
    );

    try {
      final result = await _repository.fetchHorses(
        barnId: barnId,
        reload: reload,
        searchTerm: term,
      );

      state = state.copyWith(
        searchHorses: result,
        isLoading: false,
      );

      ref.read(fetchUsersProvider.notifier).loadByHorses(result);
    } on DataProviderException catch (e) {
      state = state.copyWith(isLoading: false, exception: e);
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        exception: const UnknownDataProviderException(),
      );
    }
  }

  Future<void> fetchAllHorses({
    bool reload = false,
  }) async {
    if (reload) {
      await fetch(reload: true);
    }
    if (!state.hasMoreData) return;
    var lastLen = state.horses.length;
    while (state.hasMoreData) {
      await fetch();
      final newLen = state.horses.length;
      if (newLen <= lastLen) break;
      lastLen = newLen;
    }
  }

  void addHorse(HorseModel horse) {
    final exists = state.horses.any((h) => h.id == horse.id);
    final newHorses = exists
        ? state.horses.map((h) => h.id == horse.id ? horse : h).toList()
        : <HorseModel>[horse, ...state.horses];
    state = state.copyWith(horses: newHorses);
    ref.read(fetchUsersProvider.notifier).loadByHorses([horse]);
  }

  void updateHorse(HorseModel horse) {
    final exists = state.horses.any((h) => h.id == horse.id);
    if (!exists) return;
    final newHorses = state.horses
        .map((h) => h.id == horse.id ? horse : h)
        .toList();
    state = state.copyWith(horses: newHorses);
    ref.read(fetchUsersProvider.notifier).loadByHorses([horse]);
  }

  void updateHorseStall({
    required String horseId,
    int? stallId,
  }) {
    HorseModel? updated;
    final updatedHorses = state.horses.map((h) {
      if (h.id == horseId) {
        updated = h.copyWith(stallId: stallId);
        return updated!;
      }
      return h;
    }).toList();

    final updatedSearch = state.searchHorses.map((h) {
      if (h.id == horseId) {
        return h.copyWith(stallId: stallId);
      }
      return h;
    }).toList();

    if (updated == null) return;

    state = state.copyWith(
      horses: updatedHorses,
      searchHorses: updatedSearch,
    );
    ref.read(fetchUsersProvider.notifier).loadByHorses([updated!]);
  }

  void reset() => state = const FetchHorsesState();

  void addHorses(List<HorseModel> horses) {
    state = state.copyWith(
      horses: horses,
      searchHorses: horses,
    );
  }

  void removeHorse(HorseModel horse) {
    final updatedHorses = List<HorseModel>.from(state.horses)
      ..removeWhere((h) => h.id == horse.id);
    final updatedSearchHorses = List<HorseModel>.from(state.searchHorses)
      ..removeWhere((h) => h.id == horse.id);
    state = state.copyWith(
      horses: updatedHorses,
      searchHorses: updatedSearchHorses,
    );
  }
}
