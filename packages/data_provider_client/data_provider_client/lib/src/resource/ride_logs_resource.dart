import 'package:models/models.dart';

/// {@template ride_logs_resource}
/// Data source abstraction for managing ride logs.
/// Responsible for:
///   - Listing all ride logs for a horse
///   - Getting a ride log by id
///   - Creating a ride log
///   - Updating a ride log
///   - Deleting a ride log by id
///   - Getting ride log statistics
/// {@endtemplate}
abstract class RideLogsResource {
  /// {@macro ride_logs_resource}
  const RideLogsResource();

  /// Returns a list of ride logs for a horse.
  Future<List<RideLogModel>> getRideLogsForHorse({
    required String horseId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
  });

  /// Returns a list of ride logs for a barn (all horses).
  Future<List<RideLogModel>> getRideLogsForBarn({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    String? riderId,
  });

  /// Returns the ride log with the given [id],
  /// or throws exception if not found.
  Future<RideLogModel> getRideLog({
    required String id,
    required String horseId,
  });

  /// Creates a new ride log and returns the created [RideLogModel].
  Future<RideLogModel> createRideLog({required RideLogModel rideLog});

  /// Updates an existing ride log by id
  /// and returns the updated [RideLogModel].
  Future<RideLogModel> updateRideLog({required RideLogModel rideLog});

  /// Deletes the ride log with the given [id].
  Future<void> deleteRideLog({
    required String id,
    required String horseId,
    required String deletedBy,
  });

  /// Returns summary statistics for a horse's ride logs.
  Future<RideLogSummary> getRideLogSummary({
    required String horseId,
    required String barnId,
  });
}
