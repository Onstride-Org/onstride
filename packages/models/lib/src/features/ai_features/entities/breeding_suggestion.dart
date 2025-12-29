import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'breeding_suggestion.freezed.dart';
part 'breeding_suggestion.g.dart';

/// A breeding pairing suggestion from the AI system.
@freezed
sealed class BreedingSuggestion with _$BreedingSuggestion {
  const factory BreedingSuggestion({
    required String id,
    required String barnId,

    /// Mare information
    required String mareId,
    required String mareName,
    String? mareBreed,
    String? mareColorGenetics,
    @Default(<String>[]) List<String> mareGeneticTests,

    /// Stallion information
    required String stallionId,
    required String stallionName,
    String? stallionBreed,
    String? stallionColorGenetics,
    @Default(<String>[]) List<String> stallionGeneticTests,

    /// Compatibility analysis
    @Default(0.0) double overallCompatibilityScore,
    @Default(<BreedingFactor>[]) List<BreedingFactor> positiveFactors,
    @Default(<BreedingFactor>[]) List<BreedingFactor> negativeFactors,
    @Default(<BreedingFactor>[]) List<BreedingFactor> neutralFactors,

    /// Genetic predictions
    OffspringPrediction? offspringPrediction,

    /// Health/genetic warnings
    @Default(<GeneticWarning>[]) List<GeneticWarning> geneticWarnings,

    /// Whether user has reviewed this suggestion
    @Default(false) bool isReviewed,
    String? userNotes,

    /// Timestamps
    @TimestampConverter() required DateTime createdAt,
    String? createdBy,
  }) = _BreedingSuggestion;

  factory BreedingSuggestion.fromJson(Map<String, dynamic> json) =>
      _$BreedingSuggestionFromJson(json);
}

/// A factor considered in breeding compatibility
@freezed
sealed class BreedingFactor with _$BreedingFactor {
  const factory BreedingFactor({
    required String category, // 'genetics', 'conformation', 'temperament', 'discipline', 'bloodline'
    required String description,
    @Default(0.0) double impact, // -1.0 to 1.0
    @Default(FactorSeverity.info) FactorSeverity severity,
  }) = _BreedingFactor;

  factory BreedingFactor.fromJson(Map<String, dynamic> json) =>
      _$BreedingFactorFromJson(json);
}

enum FactorSeverity {
  info,
  positive,
  caution,
  warning,
  critical,
}

/// Predicted traits for offspring
@freezed
sealed class OffspringPrediction with _$OffspringPrediction {
  const factory OffspringPrediction({
    /// Color predictions with probabilities
    @Default(<ColorPrediction>[]) List<ColorPrediction> possibleColors,

    /// Height estimate
    String? estimatedHeightRange,

    /// Discipline suitability predictions
    @Default(<DisciplineSuitability>[])
    List<DisciplineSuitability> disciplineSuitability,

    /// Temperament tendencies
    @Default(<String>[]) List<String> temperamentTendencies,

    /// Potential health considerations
    @Default(<String>[]) List<String> healthConsiderations,
  }) = _OffspringPrediction;

  factory OffspringPrediction.fromJson(Map<String, dynamic> json) =>
      _$OffspringPredictionFromJson(json);
}

/// Color prediction for offspring
@freezed
sealed class ColorPrediction with _$ColorPrediction {
  const factory ColorPrediction({
    required String color,
    required double probability, // 0.0 to 1.0
    String? geneticNotation,
  }) = _ColorPrediction;

  factory ColorPrediction.fromJson(Map<String, dynamic> json) =>
      _$ColorPredictionFromJson(json);
}

/// Discipline suitability prediction
@freezed
sealed class DisciplineSuitability with _$DisciplineSuitability {
  const factory DisciplineSuitability({
    required String discipline,
    @Default(0.5) double suitabilityScore, // 0.0 to 1.0
    String? reasoning,
  }) = _DisciplineSuitability;

  factory DisciplineSuitability.fromJson(Map<String, dynamic> json) =>
      _$DisciplineSuitabilityFromJson(json);
}

/// Genetic health warning for breeding
@freezed
sealed class GeneticWarning with _$GeneticWarning {
  const factory GeneticWarning({
    required String condition, // 'HYPP', 'GBED', 'HERDA', 'OLWS', etc.
    required String description,
    required GeneticRisk riskLevel,

    /// Parent carrier status
    String? mareStatus, // 'N/N', 'N/H', 'H/H', etc.
    String? stallionStatus,

    /// Offspring risk
    @Default(<String, double>{}) Map<String, double> offspringProbabilities,
    // e.g., {'N/N': 0.25, 'N/H': 0.50, 'H/H': 0.25}

    /// Recommendation
    String? recommendation,
  }) = _GeneticWarning;

  factory GeneticWarning.fromJson(Map<String, dynamic> json) =>
      _$GeneticWarningFromJson(json);
}

enum GeneticRisk {
  none,
  low,
  moderate,
  high,
  critical,
}

/// A breeding analysis request
@freezed
sealed class BreedingAnalysisRequest with _$BreedingAnalysisRequest {
  const factory BreedingAnalysisRequest({
    required String id,
    required String barnId,
    required String requestedBy,

    /// Either analyze a specific pairing or find matches
    String? mareId,
    String? stallionId,
    @Default(AnalysisType.specificPairing) AnalysisType analysisType,

    /// For finding matches
    @Default(5) int maxSuggestions,
    @Default(<String>[]) List<String> preferredDisciplines,
    @Default(<String>[]) List<String> preferredColors,

    /// Processing status
    @Default(AiRequestStatus.pending) AiRequestStatus status,
    String? errorMessage,

    /// Results
    @Default(<String>[]) List<String> resultSuggestionIds,

    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? processedAt,
  }) = _BreedingAnalysisRequest;

  factory BreedingAnalysisRequest.fromJson(Map<String, dynamic> json) =>
      _$BreedingAnalysisRequestFromJson(json);
}

enum AnalysisType {
  specificPairing,
  findStallionMatches,
  findMareMatches,
}
