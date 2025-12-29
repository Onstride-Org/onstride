import 'package:billing_repository/billing_repository.dart';
import 'package:gl_horses/core/config/dependency_injection/repository/repository_providers.dart';
import 'package:gl_horses/features/billing/providers/client_tabs/client_tabs_state.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'client_tabs.g.dart';

@riverpod
class FetchClientTabs extends _$FetchClientTabs {
  BillingRepository get _repo => ref.read(billingRepositoryProvider);

  @override
  FetchClientTabsState build() => const FetchClientTabsState.initial();

  Future<void> fetchForBarn({required String barnId}) async {
    try {
      state = const FetchClientTabsState.loading();
      final tabs = await _repo.getBarnClientTabs(barnId: barnId);
      state = FetchClientTabsState.success(tabs: tabs);
    } catch (e) {
      state = FetchClientTabsState.error(message: e.toString());
    }
  }

  Future<ClientTabModel?> fetchSingleTab({
    required String clientId,
    required String barnId,
  }) async {
    try {
      return await _repo.getClientTab(clientId: clientId, barnId: barnId);
    } catch (e) {
      return null;
    }
  }

  Future<void> recalculateTab({
    required String clientId,
    required String barnId,
  }) async {
    try {
      final updated =
          await _repo.recalculateClientTab(clientId: clientId, barnId: barnId);
      if (state is SuccessFetchClientTabsState) {
        final currentState = state as SuccessFetchClientTabsState;
        final updatedTabs = currentState.tabs
            .map((t) => t.clientId == clientId ? updated : t)
            .toList();
        state = FetchClientTabsState.success(tabs: updatedTabs);
      }
    } catch (e) {
      // Silently fail for recalculation
    }
  }
}

@riverpod
class FetchBillingPeriods extends _$FetchBillingPeriods {
  BillingRepository get _repo => ref.read(billingRepositoryProvider);

  @override
  FetchBillingPeriodsState build() =>
      const FetchBillingPeriodsState.initial();

  Future<void> fetchForClient({
    required String clientId,
    required String barnId,
    BillingPeriodStatus? statusFilter,
  }) async {
    try {
      state = const FetchBillingPeriodsState.loading();
      final periods = await _repo.getClientBillingPeriods(
        clientId: clientId,
        barnId: barnId,
        statusFilter: statusFilter,
      );
      state = FetchBillingPeriodsState.success(periods: periods);
    } catch (e) {
      state = FetchBillingPeriodsState.error(message: e.toString());
    }
  }

  Future<void> fetchForBarn({
    required String barnId,
    BillingPeriodStatus? statusFilter,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      state = const FetchBillingPeriodsState.loading();
      final periods = await _repo.getBarnBillingPeriods(
        barnId: barnId,
        statusFilter: statusFilter,
        startDate: startDate,
        endDate: endDate,
      );
      state = FetchBillingPeriodsState.success(periods: periods);
    } catch (e) {
      state = FetchBillingPeriodsState.error(message: e.toString());
    }
  }

  Future<BillingPeriodModel?> createPeriod(
      CreateBillingPeriodPayload payload) async {
    try {
      final period = await _repo.createBillingPeriod(payload);
      if (state is SuccessFetchBillingPeriodsState) {
        final currentState = state as SuccessFetchBillingPeriodsState;
        state = FetchBillingPeriodsState.success(
          periods: [period, ...currentState.periods],
        );
      }
      return period;
    } catch (e) {
      return null;
    }
  }

  Future<BillingPeriodModel?> closePeriod({
    required String id,
    required String barnId,
  }) async {
    try {
      final closed = await _repo.closeBillingPeriod(id: id, barnId: barnId);
      if (state is SuccessFetchBillingPeriodsState) {
        final currentState = state as SuccessFetchBillingPeriodsState;
        final updated = currentState.periods
            .map((p) => p.id == id ? closed : p)
            .toList();
        state = FetchBillingPeriodsState.success(periods: updated);
      }
      return closed;
    } catch (e) {
      return null;
    }
  }
}
