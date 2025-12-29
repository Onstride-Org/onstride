import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:models/models.dart';

/// {@template firebase_ride_logs_resource}
/// Firebase-backed resource for managing ride logs.
/// Ride logs are stored as subcollections under horses: /horses/{horseId}/ride_logs/{logId}
/// {@endtemplate}
class FirebaseRideLogsResource with ResourceMixin implements RideLogsResource {
  /// {@macro firebase_ride_logs_resource}
  FirebaseRideLogsResource({
    FirebaseFirestore? firebase,
  }) : _firebase = firebase ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firebase;

  CollectionReference<Map<String, dynamic>> _rideLogsCollection(
    String horseId,
  ) {
    return _firebase.collection('horses').doc(horseId).collection('ride_logs');
  }

  @override
  Future<List<RideLogModel>> getRideLogsForHorse({
    required String horseId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    return secureCallback(
      () async {
        var query = _rideLogsCollection(horseId)
            .where('deleted_at', isNull: true)
            .orderBy('date', descending: true);

        if (startDate != null) {
          query = query.where(
            'date',
            isGreaterThanOrEqualTo: Timestamp.fromDate(startDate),
          );
        }

        if (endDate != null) {
          query = query.where(
            'date',
            isLessThanOrEqualTo: Timestamp.fromDate(endDate),
          );
        }

        final snapshot = await query.limit(defaultLimit).get();
        return snapshot.docs
            .map((doc) => RideLogModel.fromJson(doc.data()))
            .toList();
      },
    );
  }

  @override
  Future<List<RideLogModel>> getRideLogsForBarn({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    String? riderId,
  }) async {
    return secureCallback(
      () async {
        // Query all horses in the barn first
        final horsesSnapshot = await _firebase
            .collection('horses')
            .where('barn_id', isEqualTo: barnId)
            .where('deleted_at', isNull: true)
            .get();

        final allRideLogs = <RideLogModel>[];

        for (final horseDoc in horsesSnapshot.docs) {
          var query = _rideLogsCollection(horseDoc.id)
              .where('deleted_at', isNull: true)
              .orderBy('date', descending: true);

          if (startDate != null) {
            query = query.where(
              'date',
              isGreaterThanOrEqualTo: Timestamp.fromDate(startDate),
            );
          }

          if (endDate != null) {
            query = query.where(
              'date',
              isLessThanOrEqualTo: Timestamp.fromDate(endDate),
            );
          }

          if (riderId != null) {
            query = query.where('rider_id', isEqualTo: riderId);
          }

          final snapshot = await query.limit(50).get();
          allRideLogs.addAll(
            snapshot.docs.map((doc) => RideLogModel.fromJson(doc.data())),
          );
        }

        // Sort by date descending
        allRideLogs.sort((a, b) => b.date.compareTo(a.date));
        return allRideLogs.take(defaultLimit).toList();
      },
    );
  }

  @override
  Future<RideLogModel> getRideLog({
    required String id,
    required String horseId,
  }) async {
    return secureCallback(
      () async {
        final doc = await _rideLogsCollection(horseId).doc(id).get();
        if (!doc.exists) {
          throw const NotFoundException();
        }
        return RideLogModel.fromJson(doc.data()!);
      },
    );
  }

  @override
  Future<RideLogModel> createRideLog({required RideLogModel rideLog}) async {
    return secureCallback(
      () async {
        final docRef = _rideLogsCollection(rideLog.horseId).doc();
        final now = DateTime.now();
        final newLog = rideLog.copyWith(
          id: docRef.id,
          createdAt: now,
          updatedAt: now,
        );
        await docRef.set(newLog.toJson());
        return newLog;
      },
    );
  }

  @override
  Future<RideLogModel> updateRideLog({required RideLogModel rideLog}) async {
    return secureCallback(
      () async {
        final docRef = _rideLogsCollection(rideLog.horseId).doc(rideLog.id);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }
        final updatedLog = rideLog.copyWith(updatedAt: DateTime.now());
        await docRef.set(updatedLog.toJson(), SetOptions(merge: true));
        return updatedLog;
      },
    );
  }

  @override
  Future<void> deleteRideLog({
    required String id,
    required String horseId,
    required String deletedBy,
  }) async {
    return secureCallback<void>(
      () async {
        final docRef = _rideLogsCollection(horseId).doc(id);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }
        // Soft delete
        await docRef.update({
          'deleted_at': Timestamp.now(),
          'deleted_by': deletedBy,
        });
      },
    );
  }

  @override
  Future<RideLogSummary> getRideLogSummary({
    required String horseId,
    required String barnId,
  }) async {
    return secureCallback(
      () async {
        final allLogsSnapshot = await _rideLogsCollection(horseId)
            .where('deleted_at', isNull: true)
            .get();

        final now = DateTime.now();
        final startOfMonth = DateTime(now.year, now.month);

        var totalRides = 0;
        var totalMinutes = 0;
        var ridesThisMonth = 0;
        var minutesThisMonth = 0;

        for (final doc in allLogsSnapshot.docs) {
          final log = RideLogModel.fromJson(doc.data());
          totalRides++;
          totalMinutes += log.durationMinutes;

          if (log.date.isAfter(startOfMonth) ||
              log.date.isAtSameMomentAs(startOfMonth)) {
            ridesThisMonth++;
            minutesThisMonth += log.durationMinutes;
          }
        }

        return RideLogSummary(
          totalRides: totalRides,
          totalMinutes: totalMinutes,
          ridesThisMonth: ridesThisMonth,
          minutesThisMonth: minutesThisMonth,
        );
      },
    );
  }
}
