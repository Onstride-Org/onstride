import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/ride_logs/providers/create_ride_log/create_ride_log_state.dart';
import 'package:models/models.dart';
import 'package:ride_logs_repository/ride_logs_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'create_ride_log.g.dart';

@riverpod
class CreateRideLog extends _$CreateRideLog {
  RideLogsRepository get _repo => ref.read(rideLogsRepositoryProvider);

  @override
  CreateRideLogState build() => const CreateRideLogState.initial();

  Future<RideLogModel?> create(RideLogModel rideLog) async {
    try {
      state = const CreateRideLogState.loading();
      final created = await _repo.createRideLog(rideLog: rideLog);
      state = CreateRideLogState.success(rideLog: created);
      return created;
    } catch (e) {
      state = CreateRideLogState.error(message: e.toString());
      return null;
    }
  }

  Future<RideLogModel?> update(RideLogModel rideLog) async {
    try {
      state = const CreateRideLogState.loading();
      final updated = await _repo.updateRideLog(rideLog: rideLog);
      state = CreateRideLogState.success(rideLog: updated);
      return updated;
    } catch (e) {
      state = CreateRideLogState.error(message: e.toString());
      return null;
    }
  }

  Future<bool> delete({
    required String id,
    required String horseId,
    required String deletedBy,
  }) async {
    try {
      state = const CreateRideLogState.loading();
      await _repo.deleteRideLog(
        id: id,
        horseId: horseId,
        deletedBy: deletedBy,
      );
      state = const CreateRideLogState.initial();
      return true;
    } catch (e) {
      state = CreateRideLogState.error(message: e.toString());
      return false;
    }
  }

  void reset() {
    state = const CreateRideLogState.initial();
  }
}
