import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/config/config.dart';
import 'package:horse_repository/horse_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'load_horses_options_provider.freezed.dart';

part 'load_horses_options_provider.g.dart';

part 'load_horses_options_state.dart';

@Riverpod(keepAlive: true)
class LoadHorsesOptions extends _$LoadHorsesOptions {
  HorseRepository get _repository => ref.read(horseRepositoryProvider);

  Future<void> load() async {
    if (state is SuccessLoadHorsesOptionsState) return;
    state = const LoadHorsesOptionsState.loading();
    try {
      final breedResponse = await _repository.getHorsesBreed();
      final sexStatusResponse = await _repository.getHorsesSexStatus();
      state = LoadHorsesOptionsState.success(
        breeds: breedResponse,
        sexStatus: sexStatusResponse,
      );
    } on DataProviderException catch (e) {
      state = ErrorLoadHorsesOptionsState(exception: e);
    } on Exception catch (e) {
      state = const ErrorLoadHorsesOptionsState(
        exception: UnknownDataProviderException(),
      );
    }
  }

  @override
  LoadHorsesOptionsState build() => const LoadHorsesOptionsState.initial();
}
