import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'horse_model.freezed.dart';
part 'horse_model.g.dart';

enum HorseStatus { active, inactive }

typedef HorseBreed = LangValue;
typedef HorseSexStatus = LangValue;

@freezed
sealed class HorseModel with _$HorseModel {
  const factory HorseModel({
    required String id,
    required String barnId,
    required String name,
    required HorseSexStatus sexStatus,
    required HorseBreed breed,
    required int age,
    required DateTime birthday,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime updatedAt,
    @Default('') String createdById,
    String? color,
    String? boarderId,
    HorseStatus? status,
    @JsonKey(fromJson: fromStringOrNullableInt) int? stallId,
    @Default(<GLHorsesDocument>[]) List<GLHorsesDocument> documents,
    String? deletedBy,
    String? deletionReason,
    @NullableTimestampConverter() DateTime? deletedAt,

    // ===== Phase 5.1: USEF/FEI Registration =====
    /// USEF registration number
    String? usefNumber,
    /// FEI registration number
    String? feiNumber,
    /// Registered name (from USEF/FEI, may differ from barn name)
    String? registeredName,
    /// Competition history summary
    String? competitionHistory,
    /// Last synced from registry
    @NullableTimestampConverter() DateTime? registrySyncedAt,

    // ===== Phase 5.2: Breeding Information =====
    /// Sire (father) name
    String? sireName,
    /// Sire ID if in system
    String? sireId,
    /// Dam (mother) name
    String? damName,
    /// Dam ID if in system
    String? damId,
    /// Paternal grandsire
    String? paternalGrandsireName,
    /// Paternal granddam
    String? paternalGranddamName,
    /// Maternal grandsire
    String? maternalGrandsireName,
    /// Maternal granddam
    String? maternalGranddamName,
    /// Is this horse a stud/stallion available for breeding
    @Default(false) bool isStud,
    /// Is this horse a broodmare
    @Default(false) bool isBroodmare,
    /// Color genetics (e.g., "Ee Aa")
    String? colorGenetics,
    /// Genetic test results
    @Default(<GeneticTestResult>[]) List<GeneticTestResult> geneticTests,

    // ===== Phase 5.3: Stride Number =====
    /// Unique OnStride identification number (e.g., STR-2024-00001)
    String? strideNumber,
    /// When the Stride number was assigned
    @NullableTimestampConverter() DateTime? strideNumberAssignedAt,
  }) = _HorseModel;

  factory HorseModel.fromJson(Map<String, dynamic> json) =>
      _$HorseModelFromJson(json);
}

/// Result of a genetic test for a horse.
@freezed
sealed class GeneticTestResult with _$GeneticTestResult {
  const factory GeneticTestResult({
    /// Test name (e.g., "HYPP", "GBED", "HERDA", "OLWS")
    required String testName,
    /// Result (e.g., "N/N", "N/H", "H/H", "Positive", "Negative", "Carrier")
    required String result,
    /// Date the test was performed
    @NullableTimestampConverter() DateTime? testDate,
    /// Laboratory that performed the test
    String? laboratory,
    /// Any additional notes
    String? notes,
  }) = _GeneticTestResult;

  factory GeneticTestResult.fromJson(Map<String, dynamic> json) =>
      _$GeneticTestResultFromJson(json);
}

@freezed
sealed class HorseSummary with _$HorseSummary {
  const factory HorseSummary({
    required String id,
    required String name,
    String? boarderId,
  }) = _HorseSummary;

  factory HorseSummary.fromJson(Map<String, dynamic> json) =>
      _$HorseSummaryFromJson(json);
}

extension HorseModelX on HorseModel {
  HorseSummary toSummary() {
    return HorseSummary(
      id: id,
      name: name,
      boarderId: boarderId,
    );
  }
}
