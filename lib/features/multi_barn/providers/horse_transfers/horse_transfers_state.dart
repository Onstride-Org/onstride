import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'horse_transfers_state.freezed.dart';

@freezed
sealed class HorseTransfersState with _$HorseTransfersState {
  const factory HorseTransfersState.initial() = InitialHorseTransfersState;
  const factory HorseTransfersState.loading() = LoadingHorseTransfersState;
  const factory HorseTransfersState.success({
    required List<HorseTransfer> pendingTransfers,
    required List<HorseTransfer> transferHistory,
  }) = SuccessHorseTransfersState;
  const factory HorseTransfersState.error({required String message}) =
      ErrorHorseTransfersState;
}
