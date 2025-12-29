// lib/features/barns/providers/barn_setup_provider.dart
import 'package:barns_repository/barns_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'barn_setup_provider.freezed.dart';
part 'barn_setup_provider.g.dart';
part 'barn_setup_state.dart';

/// Controller for the Barn setup flow.
/// Stores user's selection (shape) and the final setup data.
@Riverpod(keepAlive: true)
class BarnSetupController extends _$BarnSetupController
    with ProviderGuardMixin {
  BarnsRepository get _repository => ref.read(barnsRepositoryProvider);

  void setBarn(BarnModel? barn) {
    state = BarnSetupState(
      barn: barn,
      setup: barn?.setup,
      shape: barn?.setup?.shape,
    );
  }

  void selectShape(BarnShape shape) {
    state = state.copyWith(shape: shape, status: RequestStatus.initial);
  }

  Future<void> setSetup(BarnSetup setup) async {
    state = state.copyWith(setup: setup);
    final currentBarn = ref.read(accountProvider).currentBarn;
    if (currentBarn == null) return;
    await saveBarnSetup(currentBarn);
  }

  void reset() {
    state = const BarnSetupState();
  }

  Future<void> saveBarnSetup(BarnModel currentBarn) async {
    final setup = state.setup;
    final user = ref.read(accountProvider).currentUser;
    if (setup == null) return;
    await guard<BarnModel>(
      onStart: () => state = state.copyWith(status: RequestStatus.loading),
      action: () => _repository.setBarnSetup(
        barn: currentBarn,
        setup: setup,
        userId: user.id,
      ),
      onSuccess: (data) => state = state.copyWith(
        status: RequestStatus.success,
        barn: data,
      ),
      onException: (e) =>
          state = state.copyWith(status: RequestStatus.error, exception: e),
    );
  }

  @override
  BarnSetupState build() => const BarnSetupState();
}
