import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';

class RideLogsRepository {
  RideLogsRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  Future<List<RideLogModel>> getRideLogsForHorse({
    required String horseId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return dataProviderClient.rideLogsResource.getRideLogsForHorse(
      horseId: horseId,
      barnId: barnId,
      startDate: startDate,
      endDate: endDate,
    );
  }

  Future<List<RideLogModel>> getRideLogsForBarn({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    String? riderId,
  }) {
    return dataProviderClient.rideLogsResource.getRideLogsForBarn(
      barnId: barnId,
      startDate: startDate,
      endDate: endDate,
      riderId: riderId,
    );
  }

  Future<RideLogModel> getRideLog({
    required String id,
    required String horseId,
  }) {
    return dataProviderClient.rideLogsResource.getRideLog(
      id: id,
      horseId: horseId,
    );
  }

  Future<RideLogModel> createRideLog({required RideLogModel rideLog}) {
    return dataProviderClient.rideLogsResource.createRideLog(rideLog: rideLog);
  }

  Future<RideLogModel> updateRideLog({required RideLogModel rideLog}) {
    return dataProviderClient.rideLogsResource.updateRideLog(rideLog: rideLog);
  }

  Future<void> deleteRideLog({
    required String id,
    required String horseId,
    required String deletedBy,
  }) {
    return dataProviderClient.rideLogsResource.deleteRideLog(
      id: id,
      horseId: horseId,
      deletedBy: deletedBy,
    );
  }

  Future<RideLogSummary> getRideLogSummary({
    required String horseId,
    required String barnId,
  }) {
    return dataProviderClient.rideLogsResource.getRideLogSummary(
      horseId: horseId,
      barnId: barnId,
    );
  }
}
