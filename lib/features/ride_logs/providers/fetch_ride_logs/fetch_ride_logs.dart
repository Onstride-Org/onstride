import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/ride_logs/providers/fetch_ride_logs/fetch_ride_logs_state.dart';
import 'package:models/models.dart';
import 'package:ride_logs_repository/ride_logs_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fetch_ride_logs.g.dart';

@riverpod
class FetchRideLogs extends _$FetchRideLogs {
  RideLogsRepository get _repo => ref.read(rideLogsRepositoryProvider);

  @override
  FetchRideLogsState build() => const FetchRideLogsState.initial();

  Future<void> fetchForHorse({
    required String horseId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      state = const FetchRideLogsState.loading();
      final rideLogs = await _repo.getRideLogsForHorse(
        horseId: horseId,
        barnId: barnId,
        startDate: startDate,
        endDate: endDate,
      );
      final summary = await _repo.getRideLogSummary(
        horseId: horseId,
        barnId: barnId,
      );
      state = FetchRideLogsState.success(
        rideLogs: rideLogs,
        summary: summary,
      );
    } catch (e) {
      state = FetchRideLogsState.error(message: e.toString());
    }
  }

  Future<void> fetchForBarn({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    String? riderId,
  }) async {
    try {
      state = const FetchRideLogsState.loading();
      final rideLogs = await _repo.getRideLogsForBarn(
        barnId: barnId,
        startDate: startDate,
        endDate: endDate,
        riderId: riderId,
      );
      state = FetchRideLogsState.success(rideLogs: rideLogs);
    } catch (e) {
      state = FetchRideLogsState.error(message: e.toString());
    }
  }

  void addRideLog(RideLogModel rideLog) {
    if (state is SuccessFetchRideLogsState) {
      final currentState = state as SuccessFetchRideLogsState;
      final updatedLogs = [rideLog, ...currentState.rideLogs];
      state = FetchRideLogsState.success(
        rideLogs: updatedLogs,
        summary: currentState.summary,
      );
    }
  }

  void updateRideLog(RideLogModel rideLog) {
    if (state is SuccessFetchRideLogsState) {
      final currentState = state as SuccessFetchRideLogsState;
      final updatedLogs = currentState.rideLogs
          .map((log) => log.id == rideLog.id ? rideLog : log)
          .toList();
      state = FetchRideLogsState.success(
        rideLogs: updatedLogs,
        summary: currentState.summary,
      );
    }
  }

  void removeRideLog(String rideLogId) {
    if (state is SuccessFetchRideLogsState) {
      final currentState = state as SuccessFetchRideLogsState;
      final updatedLogs = currentState.rideLogs
          .where((log) => log.id != rideLogId)
          .toList();
      state = FetchRideLogsState.success(
        rideLogs: updatedLogs,
        summary: currentState.summary,
      );
    }
  }
}
