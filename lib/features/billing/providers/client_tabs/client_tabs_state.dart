import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'client_tabs_state.freezed.dart';

@freezed
sealed class FetchClientTabsState with _$FetchClientTabsState {
  const factory FetchClientTabsState.initial() = InitialFetchClientTabsState;
  const factory FetchClientTabsState.loading() = LoadingFetchClientTabsState;
  const factory FetchClientTabsState.success({
    required List<ClientTabModel> tabs,
  }) = SuccessFetchClientTabsState;
  const factory FetchClientTabsState.error({required String message}) =
      ErrorFetchClientTabsState;
}

@freezed
sealed class FetchBillingPeriodsState with _$FetchBillingPeriodsState {
  const factory FetchBillingPeriodsState.initial() =
      InitialFetchBillingPeriodsState;
  const factory FetchBillingPeriodsState.loading() =
      LoadingFetchBillingPeriodsState;
  const factory FetchBillingPeriodsState.success({
    required List<BillingPeriodModel> periods,
  }) = SuccessFetchBillingPeriodsState;
  const factory FetchBillingPeriodsState.error({required String message}) =
      ErrorFetchBillingPeriodsState;
}
