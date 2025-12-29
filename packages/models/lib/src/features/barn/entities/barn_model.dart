import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'barn_model.freezed.dart';
part 'barn_model.g.dart';

enum BarnShape { circle, lShape, aisles }

@freezed
sealed class BarnModel with _$BarnModel {
  const factory BarnModel({
    required String id,
    required String ownerId,
    required String name,
    @Default('') String connectedAccountId,
    BarnSetup? setup,
    @JsonKey(fromJson: _orderByKey)
    @Default({})
    Map<int, StallPosition> stallPositions,
    @NullableTimestampConverter() DateTime? deletedAt,
    String? deletedBy,
    String? deletionReason,
  }) = _BarnModel;

  factory BarnModel.fromJson(Map<String, dynamic> json) =>
      _$BarnModelFromJson(json);
}

@freezed
sealed class BarnSetup with _$BarnSetup {
  const factory BarnSetup({
    required BarnShape shape,
    required int stalls,
    int? stallsPerAisle,
    int? verticalStalls,
    int? horizontalStalls,
  }) = _BarnSetup;

  factory BarnSetup.fromJson(Map<String, dynamic> json) =>
      _$BarnSetupFromJson(json);
}

@freezed
sealed class StallPosition with _$StallPosition {
  const factory StallPosition({
    @JsonKey(fromJson: fromStringOrInt) required int id,
    required String stallName,
    String? horseId,
  }) = _StallPosition;

  factory StallPosition.fromJson(Map<String, dynamic> json) =>
      _$StallPositionFromJson(json);
}

extension StallPositionExtension on StallPosition {
  StallPosition assignHorse(String? horseId) {
    return copyWith(horseId: horseId);
  }

  bool get isOccupied => horseId != null;

  bool get isFree => horseId == null;
}

extension BarnModelX on BarnModel {
  /// Returns the positions that would be removed when the barn's
  /// total stall count is reduced to [newCount].
  ///
  /// It filters by the stall index (map key), not by insertion order.
  /// Only keys >= [newCount] are returned.
  Map<int, StallPosition> removedPositions(int newCount) {
    if (stallPositions.isEmpty) return const <int, StallPosition>{};
    final removed = <int, StallPosition>{};
    for (final entry in stallPositions.entries) {
      if (entry.key >= newCount) {
        removed[entry.key] = entry.value;
      }
    }
    return removed;
  }

  /// (Optional helper) Returns the positions that remain valid
  /// when limiting the barn to [newCount] stalls (keys < [newCount]).
  Map<int, StallPosition> keptPositions(int newCount) {
    if (stallPositions.isEmpty) return const <int, StallPosition>{};
    final kept = <int, StallPosition>{};
    for (final entry in stallPositions.entries) {
      if (entry.key < newCount) {
        kept[entry.key] = entry.value;
      }
    }
    return kept;
  }
}

Map<int, StallPosition> _orderByKey(Map<String, dynamic>? json) {
  if (json == null) return {};
  final entries =
      json.entries
          .map((entry) {
            final key = int.tryParse(entry.key);
            if (key == null) return null;
            return MapEntry(
              key,
              StallPosition.fromJson(entry.value as Map<String, dynamic>),
            );
          })
          .whereType<MapEntry<int, StallPosition>>()
          .toList()
        ..sort((a, b) => a.key.compareTo(b.key));
  return Map<int, StallPosition>.fromEntries(entries);
}
