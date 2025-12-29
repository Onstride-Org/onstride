import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'fetch_ride_logs_state.freezed.dart';

@freezed
sealed class FetchRideLogsState with _$FetchRideLogsState {
  const factory FetchRideLogsState.initial() = InitialFetchRideLogsState;
  const factory FetchRideLogsState.loading() = LoadingFetchRideLogsState;
  const factory FetchRideLogsState.success({
    required List<RideLogModel> rideLogs,
    RideLogSummary? summary,
  }) = SuccessFetchRideLogsState;
  const factory FetchRideLogsState.error({required String message}) =
      ErrorFetchRideLogsState;
}
