import 'package:account_repository/account_repository.dart';
import 'package:barns_repository/barns_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/config/config.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'account_provider.freezed.dart';
part 'account_provider.g.dart';
part 'account_state.dart';

@Riverpod(keepAlive: true)
class Account extends _$Account {
  AccountRepository get _repository => ref.read(accountRepositoryProvider);

  BarnsRepository get _barnsRepository => ref.read(barnsRepositoryProvider);

  Future<void> loadUser(String id) async {
    try {
      state = const AccountState.loading();
      final res = await _repository.fetchUser(id: id);
      final barn = await _barnsRepository.getBarnById(barnId: res.barnId);
      state = AccountState.success(user: res, userBarn: barn);
    } on DataProviderException catch (e) {
      state = AccountState.error(exception: e);
    }
  }

  void setUser(GLUser user) {
    state = AccountState.success(user: user);
  }

  void setBarn(BarnModel barn) {
    switch (state) {
      case SuccessAccountState(:final user):
        state = AccountState.success(
          user: user.copyWith(barnId: barn.id),
          userBarn: barn,
        );
        return;
      case InitialAccountState():
      case LoadingAccountState():
      case UpdatingAccountState():
      case ErrorAccountState():
        return;
    }
  }

  List<StallPosition> getStallPositions() {
    return state.currentBarn?.stallPositions.values.toList() ?? [];
  }

  StallPosition? getStallPositionById(int? stallId) {
    return state.currentBarn?.stallPositions[stallId];
  }

  void updateStallPositions(
    Map<int, StallPosition> updatedStallPositions,
  ) {
    final currentBarn = state.currentBarn;
    if (currentBarn != null && state is SuccessAccountState) {
      final updatedBarn = currentBarn.copyWith(
        stallPositions: updatedStallPositions,
      );
      setBarn(updatedBarn);
      // try {
      //   await _barnsRepository.updateBarn(barn: updatedBarn);
      // } on Exception {
      //   if (state is SuccessAccountState) {
      //     final successState = state as SuccessAccountState;
      //     state = successState.copyWith(userBarn: currentBarn);
      //   }
      //   rethrow;
      // }
    }
  }

  void assignHorseToStall(int stallId, String? horseId) {
    final currentBarn = state.currentBarn;
    if (currentBarn == null || state is! SuccessAccountState) return;

    final targetStall = currentBarn.stallPositions[stallId];
    if (targetStall == null) return;

    final updatedStallPositions = Map<int, StallPosition>.from(
      currentBarn.stallPositions,
    );

    if (horseId != null) {
      for (final entry in currentBarn.stallPositions.entries) {
        if (entry.value.horseId == horseId && entry.key != stallId) {
          updatedStallPositions[entry.key] = entry.value.assignHorse(null);
          break;
        }
      }
    }
    updatedStallPositions[stallId] = targetStall.assignHorse(horseId);
    updateStallPositions(updatedStallPositions);
  }

  @override
  AccountState build() => const AccountState.initial();
}
