import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:models/models.dart';
import 'package:uuid/uuid.dart';

class FirebaseBarnsResource with ResourceMixin implements BarnsResource {
  FirebaseBarnsResource({FirebaseFirestore? firebase})
      : _firebase = firebase ?? FirebaseFirestore.instance;

  final Uuid uuid = const Uuid();
  final FirebaseFirestore _firebase;

  @override
  Future<BarnModel> createBarn({
    required String ownerId,
    required String name,
    required String connectedAccountId,
  }) =>
      secureCallback(
        () async {
          final data = {
            'owner_id': ownerId,
            'name': name,
            'deleted_at': null,
            'connected_account_id': connectedAccountId,
            ...creationDates,
          };
          final ref = await _firebase.collection('barns').add(data);
          await ref.update({'id': ref.id});
          await _firebase.collection('users').doc(ownerId).update({
            'barn_id': ref.id,
          });
          return BarnModel.fromJson({'id': ref.id, ...data});
        },
      );

  @override
  Future<BarnModel?> getBarnById({required String barnId}) => secureCallback(
        () async {
          final snap = await _firebase.collection('barns').doc(barnId).get();
          if (snap.exists) {
            final barnModel = BarnModel.fromJson(snap.data()!);
            return barnModel;
          }
          return null;
        },
      );

  @override
  Future<BarnModel> setBarnSetup({
    required String userId,
    required BarnModel barn,
    required BarnSetup setup,
  }) {
    return secureCallback(() async {
      final previousPositions = barn.stallPositions;
      final entries = _makeStallEntries(
        previous: previousPositions,
        setup: setup,
      );
      final removed = barn.removedPositions(setup.stalls);
      final batch = _firebase.batch();
      for (final r in removed.entries) {
        final horseId = r.value.horseId;
        if (horseId != null) {
          final horseRef = _firebase.collection('horses').doc(horseId);
          batch.update(horseRef, {'stall_id': null});
        }
      }
      final newBarn = barn.copyWith(
        setup: setup,
        stallPositions: Map<int, StallPosition>.fromEntries(entries),
      );
      final doc = _firebase.collection('barns').doc(barn.id);
      batch
        ..update(doc, {
          ...newBarn.toJson(),
          'updated_at': FieldValue.serverTimestamp(),
        })
        ..set(doc.collection('logs').doc(uuid.v4()), {
          'updated_by': userId,
          'updated_at': FieldValue.serverTimestamp(),
          'setup': setup.toString(),
        });
      await batch.commit();
      return newBarn;
    });
  }

  /// Builds the new stall entries preserving horse assignments when possible.
  ///
  /// This method generates exactly [setup.stalls] entries with string ids "0".."N-1".
  /// If a previous position exists for a given id, its `horseId` is preserved.
  /// The `stallName` can be adjusted here depending on the [setup.shape] as needed.
  List<MapEntry<int, StallPosition>> _makeStallEntries({
    required Map<int, StallPosition> previous,
    required BarnSetup setup,
  }) {
    return List<MapEntry<int, StallPosition>>.generate(
      setup.stalls,
      (index) {
        final id = index;
        final prev = previous[id];
        final name = _stallNameFor(index: index, setup: setup);
        return MapEntry(
          id,
          StallPosition(
            id: id,
            stallName: name,
            horseId: prev?.horseId,
          ),
        );
      },
    );
  }

  /// Computes a stall name depending on the [setup.shape].
  ///
  /// - For [BarnShape.aisles], names are grouped by [setup.stallsPerAisle].
  ///   Example: stallsPerAisle = 4, stalls = 10
  ///   → A-1, A-2, A-3, A-4, B-1, B-2, B-3, B-4, C-1, C-2
  /// - For other shapes, fallback to a simple sequential "A-{index+1}".
  String _stallNameFor({
    required int index,
    required BarnSetup setup,
  }) {
    switch (setup.shape) {
      case BarnShape.aisles:
        final perAisle = setup.stallsPerAisle ?? 1;
        if (perAisle <= 0) return 'A-${index + 1}';
        final aisleIndex = index ~/ perAisle;
        final positionInAisle = (index % perAisle) + 1;
        final aisleLetter = String.fromCharCode('A'.codeUnitAt(0) + aisleIndex);
        return '$aisleLetter-$positionInAisle';
      case BarnShape.circle:
        return 'S-${index + 1}';
      case BarnShape.lShape:
        return 'L-${index + 1}';
    }
  }

  @override
  Future<BarnModel> updateBarnPosition({
    required BarnModel barn,
    required StallPosition stall,
    StallPosition? previousStall,
  }) {
    return secureCallback(
      () async {
        final batch = _firebase.batch();
        final barnRef = _firebase.collection('barns').doc(barn.id);
        batch.update(barnRef, {
          'stall_positions.${stall.id}': stall.toJson(),
          if (previousStall != null && previousStall.horseId != null)
            'stall_positions.${previousStall.id}.horse_id': null,
        });
        if (previousStall != null && previousStall.horseId != null) {
          final horseRef =
              _firebase.collection('horses').doc(previousStall.horseId);
          batch.update(horseRef, {'stall_id': null});
        }
        if (stall.horseId != null) {
          final horseRef = _firebase.collection('horses').doc(stall.horseId);
          batch.update(horseRef, {'stall_id': stall.id});
        }
        await batch.commit();
        final newStalls = Map<int, StallPosition>.from(barn.stallPositions);
        newStalls[stall.id] = stall;
        if (previousStall != null) {
          newStalls[previousStall.id] = previousStall.copyWith(horseId: null);
        }
        return barn.copyWith(stallPositions: newStalls);
      },
    );
  }

  @override
  Future<BarnModel> removeHorseFromStall({
    required BarnModel barn,
    required StallPosition stall,
  }) {
    return secureCallback(
      () async {
        final batch = _firebase.batch();
        final barnRef = _firebase.collection('barns').doc(barn.id);
        batch.update(barnRef, {
          'stall_positions.${stall.id}.horse_id': null,
        });
        if (stall.horseId != null) {
          final horseRef = _firebase.collection('horses').doc(stall.horseId);
          batch.update(horseRef, {'stall_id': null});
        }
        await batch.commit();
        final newStalls = Map<int, StallPosition>.from(barn.stallPositions);
        final current = newStalls[stall.id] ?? stall;
        newStalls[stall.id] = current.copyWith(horseId: null);
        return barn.copyWith(stallPositions: newStalls);
      },
    );
  }
}
