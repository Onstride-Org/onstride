import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/multi_barn/providers/horse_transfers/horse_transfers_state.dart';
import 'package:models/models.dart';
import 'package:multi_barn_repository/multi_barn_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'horse_transfers.g.dart';

@riverpod
class HorseTransfers extends _$HorseTransfers {
  MultiBarnRepository get _repo => ref.read(multiBarnRepositoryProvider);

  @override
  HorseTransfersState build() => const HorseTransfersState.initial();

  Future<void> fetch({required String barnId}) async {
    try {
      state = const HorseTransfersState.loading();
      final pending = await _repo.getPendingTransfers(barnId: barnId);
      final history = await _repo.getTransferHistory(barnId: barnId);
      state = HorseTransfersState.success(
        pendingTransfers: pending,
        transferHistory: history,
      );
    } catch (e) {
      state = HorseTransfersState.error(message: e.toString());
    }
  }

  Future<void> initiateTransfer(InitiateTransferPayload payload) async {
    try {
      final transfer = await _repo.initiateTransfer(payload);
      if (state is SuccessHorseTransfersState) {
        final currentState = state as SuccessHorseTransfersState;
        state = HorseTransfersState.success(
          pendingTransfers: [...currentState.pendingTransfers, transfer],
          transferHistory: currentState.transferHistory,
        );
      }
    } catch (e) {
      state = HorseTransfersState.error(message: e.toString());
    }
  }

  Future<void> respondToTransfer(RespondToTransferPayload payload) async {
    try {
      final updated = await _repo.respondToTransfer(payload);
      if (state is SuccessHorseTransfersState) {
        final currentState = state as SuccessHorseTransfersState;
        final updatedPending = currentState.pendingTransfers
            .where((t) => t.id != updated.id)
            .toList();
        state = HorseTransfersState.success(
          pendingTransfers: updatedPending,
          transferHistory: [updated, ...currentState.transferHistory],
        );
      }
    } catch (e) {
      state = HorseTransfersState.error(message: e.toString());
    }
  }

  Future<void> completeTransfer({required String transferId}) async {
    try {
      final completed = await _repo.completeTransfer(transferId: transferId);
      if (state is SuccessHorseTransfersState) {
        final currentState = state as SuccessHorseTransfersState;
        final updatedPending = currentState.pendingTransfers
            .where((t) => t.id != completed.id)
            .toList();
        final updatedHistory = currentState.transferHistory
            .map((t) => t.id == completed.id ? completed : t)
            .toList();
        if (!updatedHistory.any((t) => t.id == completed.id)) {
          updatedHistory.insert(0, completed);
        }
        state = HorseTransfersState.success(
          pendingTransfers: updatedPending,
          transferHistory: updatedHistory,
        );
      }
    } catch (e) {
      state = HorseTransfersState.error(message: e.toString());
    }
  }
}
