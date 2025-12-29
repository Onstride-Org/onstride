import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/horses/providers/fetch_horses/fetch_horses_provider.dart';
import 'package:horse_repository/horse_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'get_boarder_horses_provider.freezed.dart';
part 'get_boarder_horses_provider.g.dart';
part 'get_boarder_horses_state.dart';

@Riverpod(keepAlive: true)
class GetBoarderHorses extends _$GetBoarderHorses {
  HorseRepository get _repository => ref.read(horseRepositoryProvider);

  void addHorse(HorseModel horse) {
    final newHorses = [horse, ...state.allHorses];
    state = GetBoarderHorsesState.success(horses: newHorses);
  }

  void updateHorse(HorseModel horse) {
    final index = state.allHorses.indexWhere((e) => e.id == horse.id);
    if (index != -1) {
      final updatedList = [...state.allHorses];
      updatedList[index] = horse;
      state = GetBoarderHorsesState.success(horses: updatedList);
    }
  }

  Future<void> load() async {
    try {
      final user = ref.read(accountProvider).currentUser;
      if (!user.isBoarder) return;
      state = const LoadingGetBoarderHorsesState();
      final barnId = user.barnId ?? '';
      final results = await _repository.getAllBoarderHorses(
        barnId: barnId,
        boarderId: user.id,
      );
      ref.read(fetchHorsesProvider.notifier).addHorses(results);
      state = SuccessGetBoarderHorsesState(horses: results);
    } on DataProviderException catch (e) {
      state = GetBoarderHorsesState.error(exception: e);
    }
  }

  @override
  GetBoarderHorsesState build() => const GetBoarderHorsesState.initial();
}
