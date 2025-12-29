import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'barn_summary.freezed.dart';
part 'barn_summary.g.dart';

/// A lightweight summary of a barn for display in barn switcher.
@freezed
sealed class BarnSummary with _$BarnSummary {
  const factory BarnSummary({
    required String id,
    required String name,
    required BarnRole userRole,

    /// Barn logo URL (if branding is set up)
    String? logoUrl,

    /// Primary brand color (hex)
    String? primaryColor,

    /// Number of horses in the barn
    @Default(0) int horseCount,

    /// Number of members in the barn
    @Default(0) int memberCount,

    /// Whether this is the user's primary barn
    @Default(false) bool isPrimary,

    /// Last time the user accessed this barn
    @NullableTimestampConverter() DateTime? lastAccessedAt,
  }) = _BarnSummary;

  factory BarnSummary.fromJson(Map<String, dynamic> json) =>
      _$BarnSummaryFromJson(json);
}
