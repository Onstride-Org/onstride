// lib/features/barns/providers/update_barn_position_provider.dart
import 'package:barns_repository/barns_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'update_barn_position_provider.freezed.dart';
part 'update_barn_position_provider.g.dart';

/// State for updating a barn position.
@freezed
sealed class UpdateBarnPositionState with _$UpdateBarnPositionState {
  const factory UpdateBarnPositionState.initial() =
      InitialUpdateBarnPositionState;

  const factory UpdateBarnPositionState.loading() =
      LoadingUpdateBarnPositionState;

  const factory UpdateBarnPositionState.success({
    required BarnModel barn,
    required StallPosition stall,
  }) = SuccessUpdateBarnPositionState;

  const factory UpdateBarnPositionState.error({
    required DataProviderException exception,
  }) = ErrorUpdateBarnPositionState;
}

/// Controller that updates a stall position within a barn.
/// Wraps repository calls with a guarded flow (loading/success/error).
@riverpod
class UpdateBarnPosition extends _$UpdateBarnPosition with ProviderGuardMixin {
  BarnsRepository get _repository => ref.read(barnsRepositoryProvider);

  Future<void> removeHorseFromStall({
    required BarnModel barn,
    required StallPosition stall,
  }) async {
    if (stall.horseId == null) return;
    await guard<BarnModel>(
      action: () => _repository.removeHorseFromStall(
        barn: barn,
        stall: stall,
      ),
      onStart: () => state = const UpdateBarnPositionState.loading(),
      onSuccess: (updated) => state = UpdateBarnPositionState.success(
        barn: updated,
        stall: stall.copyWith(horseId: null),
      ),
      onException: (e) {
        state = UpdateBarnPositionState.error(exception: e);
      },
    );
  }

  Future<void> setHorseToTheStall({
    required BarnModel barn,
    required StallPosition stall,
    StallPosition? previousStall,
  }) async {
    await guard<BarnModel>(
      action: () => _repository.updateBarnPosition(
        barn: barn,
        stall: stall,
        previousStall: previousStall,
      ),
      onStart: () => state = const UpdateBarnPositionState.loading(),
      onSuccess: (updated) => state = UpdateBarnPositionState.success(
        barn: updated,
        stall: stall,
      ),
      onException: (e) {
        state = UpdateBarnPositionState.error(exception: e);
      },
    );
  }

  @override
  UpdateBarnPositionState build() => const UpdateBarnPositionState.initial();
}
