import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/multi_barn/providers/fetch_user_barns/fetch_user_barns_state.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fetch_user_barns.g.dart';

@Riverpod(keepAlive: true)
class FetchUserBarns extends _$FetchUserBarns {
  @override
  FetchUserBarnsState build() => const FetchUserBarnsState.initial();

  Future<void> fetch({required String userId}) async {
    try {
      state = const FetchUserBarnsState.loading();
      final repo = ref.read(multiBarnRepositoryProvider);
      final barns = await repo.getUserBarnSummaries(userId: userId);
      final currentBarn = barns.firstWhere(
        (b) => b.isPrimary,
        orElse: () =>
            barns.isNotEmpty ? barns.first : throw Exception('No barns'),
      );
      state = FetchUserBarnsState.success(
        barns: barns,
        currentBarn: currentBarn,
      );
    } on Exception catch (e) {
      state = FetchUserBarnsState.error(message: e.toString());
    }
  }

  Future<void> switchBarn({
    required String userId,
    required String barnId,
  }) async {
    try {
      final repo = ref.read(multiBarnRepositoryProvider);
      await repo.setPrimaryBarn(userId: userId, barnId: barnId);
      // Refresh the list
      await fetch(userId: userId);
    } on Exception catch (e) {
      state = FetchUserBarnsState.error(message: e.toString());
    }
  }

  BarnSummary? get currentBarn {
    final s = state;
    if (s is SuccessFetchUserBarnsState) {
      return s.currentBarn;
    }
    return null;
  }

  List<BarnSummary> get barns {
    final s = state;
    if (s is SuccessFetchUserBarnsState) {
      return s.barns;
    }
    return [];
  }
}
