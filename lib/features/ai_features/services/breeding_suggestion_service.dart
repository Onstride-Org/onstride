import 'package:models/models.dart';

/// Service for generating AI-powered breeding suggestions.
class BreedingSuggestionService {
  /// Analyzes a breeding pairing and generates suggestions.
  BreedingSuggestion analyzeBreedingPair({
    required String barnId,
    required HorseModel mare,
    required HorseModel stallion,
    String? createdBy,
  }) {
    final now = DateTime.now();
    final positiveFactors = <BreedingFactor>[];
    final negativeFactors = <BreedingFactor>[];
    final neutralFactors = <BreedingFactor>[];
    final geneticWarnings = <GeneticWarning>[];

    // Analyze breed compatibility
    _analyzeBreedCompatibility(
      mare,
      stallion,
      positiveFactors,
      negativeFactors,
      neutralFactors,
    );

    // Analyze genetic health risks
    _analyzeGeneticRisks(
      mare,
      stallion,
      geneticWarnings,
      negativeFactors,
    );

    // Generate offspring predictions
    final offspringPrediction = _generateOffspringPrediction(mare, stallion);

    // Calculate overall compatibility score
    final overallScore = _calculateOverallScore(
      positiveFactors,
      negativeFactors,
      geneticWarnings,
    );

    return BreedingSuggestion(
      id: 'breed_${now.millisecondsSinceEpoch}',
      barnId: barnId,
      mareId: mare.id,
      mareName: mare.name,
      mareBreed: mare.breed.langValue,
      mareColorGenetics: mare.colorGenetics,
      mareGeneticTests: mare.geneticTests.map((t) => '${t.testName}: ${t.result}').toList(),
      stallionId: stallion.id,
      stallionName: stallion.name,
      stallionBreed: stallion.breed.langValue,
      stallionColorGenetics: stallion.colorGenetics,
      stallionGeneticTests:
          stallion.geneticTests.map((t) => '${t.testName}: ${t.result}').toList(),
      overallCompatibilityScore: overallScore,
      positiveFactors: positiveFactors,
      negativeFactors: negativeFactors,
      neutralFactors: neutralFactors,
      offspringPrediction: offspringPrediction,
      geneticWarnings: geneticWarnings,
      createdAt: now,
      createdBy: createdBy,
    );
  }

  void _analyzeBreedCompatibility(
    HorseModel mare,
    HorseModel stallion,
    List<BreedingFactor> positive,
    List<BreedingFactor> negative,
    List<BreedingFactor> neutral,
  ) {
    final mareBreed = mare.breed.langValue.toLowerCase();
    final stallionBreed = stallion.breed.langValue.toLowerCase();

    // Same breed is generally positive for purebred goals
    if (mareBreed == stallionBreed) {
      positive.add(const BreedingFactor(
        category: 'bloodline',
        description: 'Same breed pairing - suitable for purebred breeding',
        impact: 0.3,
        severity: FactorSeverity.positive,
      ));
    }

    // Check for common sport horse crosses
    final sportBreeds = [
      'thoroughbred',
      'warmblood',
      'hanoverian',
      'holsteiner',
      'oldenburg',
      'dutch warmblood',
      'trakehner',
    ];
    final isMareAthlete = sportBreeds.any((b) => mareBreed.contains(b));
    final isStallionAthlete = sportBreeds.any((b) => stallionBreed.contains(b));

    if (isMareAthlete && isStallionAthlete) {
      positive.add(const BreedingFactor(
        category: 'discipline',
        description: 'Both parents are athletic breeds - good for sport horse production',
        impact: 0.25,
        severity: FactorSeverity.positive,
      ));
    }

    // Check for size compatibility (simplified)
    final ponyBreeds = ['shetland', 'welsh', 'miniature', 'pony'];
    final isMareSmall = ponyBreeds.any((b) => mareBreed.contains(b));
    final isStallionSmall = ponyBreeds.any((b) => stallionBreed.contains(b));

    if (isMareSmall != isStallionSmall) {
      neutral.add(const BreedingFactor(
        category: 'conformation',
        description: 'Size difference between parents - offspring size may vary',
        impact: 0.0,
        severity: FactorSeverity.info,
      ));
    }
  }

  void _analyzeGeneticRisks(
    HorseModel mare,
    HorseModel stallion,
    List<GeneticWarning> warnings,
    List<BreedingFactor> negativeFactors,
  ) {
    // Common genetic conditions to check
    final conditionsToCheck = [
      ('HYPP', 'Hyperkalemic Periodic Paralysis'),
      ('GBED', 'Glycogen Branching Enzyme Deficiency'),
      ('HERDA', 'Hereditary Equine Regional Dermal Asthenia'),
      ('OLWS', 'Overo Lethal White Syndrome'),
      ('PSSM', 'Polysaccharide Storage Myopathy'),
    ];

    for (final (code, name) in conditionsToCheck) {
      final mareTest = mare.geneticTests.cast<GeneticTestResult?>().firstWhere(
            (t) => t?.testName.toUpperCase() == code,
            orElse: () => null,
          );
      final stallionTest = stallion.geneticTests.cast<GeneticTestResult?>().firstWhere(
            (t) => t?.testName.toUpperCase() == code,
            orElse: () => null,
          );

      if (mareTest != null || stallionTest != null) {
        final warning = _analyzeGeneticCondition(
          code,
          name,
          mareTest?.result,
          stallionTest?.result,
        );
        if (warning != null) {
          warnings.add(warning);
          if (warning.riskLevel == GeneticRisk.high ||
              warning.riskLevel == GeneticRisk.critical) {
            negativeFactors.add(BreedingFactor(
              category: 'genetics',
              description: '$name risk: ${warning.description}',
              impact: warning.riskLevel == GeneticRisk.critical ? -0.5 : -0.3,
              severity: warning.riskLevel == GeneticRisk.critical
                  ? FactorSeverity.critical
                  : FactorSeverity.warning,
            ));
          }
        }
      }
    }
  }

  GeneticWarning? _analyzeGeneticCondition(
    String code,
    String name,
    String? mareResult,
    String? stallionResult,
  ) {
    final mareStatus = _normalizeGeneticResult(mareResult);
    final stallionStatus = _normalizeGeneticResult(stallionResult);

    // Both clear
    if (mareStatus == 'N/N' && stallionStatus == 'N/N') {
      return GeneticWarning(
        condition: code,
        description: 'Both parents test negative - no risk',
        riskLevel: GeneticRisk.none,
        mareStatus: mareStatus,
        stallionStatus: stallionStatus,
        offspringProbabilities: {'N/N': 1.0},
        recommendation: 'No concerns for this condition.',
      );
    }

    // One carrier, one clear
    if ((mareStatus == 'N/H' && stallionStatus == 'N/N') ||
        (mareStatus == 'N/N' && stallionStatus == 'N/H')) {
      return GeneticWarning(
        condition: code,
        description: 'One parent is a carrier - 50% chance of carrier offspring',
        riskLevel: GeneticRisk.low,
        mareStatus: mareStatus,
        stallionStatus: stallionStatus,
        offspringProbabilities: {'N/N': 0.5, 'N/H': 0.5},
        recommendation: 'Consider testing offspring. No affected foals expected.',
      );
    }

    // Both carriers
    if (mareStatus == 'N/H' && stallionStatus == 'N/H') {
      return GeneticWarning(
        condition: code,
        description: 'Both parents are carriers - 25% risk of affected offspring',
        riskLevel: GeneticRisk.high,
        mareStatus: mareStatus,
        stallionStatus: stallionStatus,
        offspringProbabilities: {'N/N': 0.25, 'N/H': 0.5, 'H/H': 0.25},
        recommendation:
            'HIGH RISK: 25% chance of affected foal. Consider alternative pairing.',
      );
    }

    // One affected
    if (mareStatus == 'H/H' || stallionStatus == 'H/H') {
      return GeneticWarning(
        condition: code,
        description: 'One parent is affected - all offspring will be carriers or affected',
        riskLevel: GeneticRisk.critical,
        mareStatus: mareStatus,
        stallionStatus: stallionStatus,
        offspringProbabilities:
            stallionStatus == 'N/N' || mareStatus == 'N/N'
                ? {'N/H': 1.0}
                : {'N/H': 0.5, 'H/H': 0.5},
        recommendation: 'NOT RECOMMENDED: High risk of producing affected foals.',
      );
    }

    return null;
  }

  String _normalizeGeneticResult(String? result) {
    if (result == null) return 'Unknown';
    final upper = result.toUpperCase().trim();

    if (upper.contains('N/N') || upper.contains('NEGATIVE') || upper.contains('CLEAR')) {
      return 'N/N';
    }
    if (upper.contains('N/H') ||
        upper.contains('N/O') ||
        upper.contains('CARRIER')) {
      return 'N/H';
    }
    if (upper.contains('H/H') ||
        upper.contains('O/O') ||
        upper.contains('POSITIVE') ||
        upper.contains('AFFECTED')) {
      return 'H/H';
    }
    return 'Unknown';
  }

  OffspringPrediction _generateOffspringPrediction(
    HorseModel mare,
    HorseModel stallion,
  ) {
    return OffspringPrediction(
      possibleColors: _predictColors(mare.colorGenetics, stallion.colorGenetics),
      estimatedHeightRange: _estimateHeight(mare, stallion),
      disciplineSuitability: _predictDisciplines(mare, stallion),
      temperamentTendencies: _predictTemperament(mare, stallion),
      healthConsiderations: [],
    );
  }

  List<ColorPrediction> _predictColors(String? mareGenetics, String? stallionGenetics) {
    // Simplified color prediction based on common genetics
    // Full implementation would need complete color genetics calculator

    final predictions = <ColorPrediction>[];

    if (mareGenetics == null && stallionGenetics == null) {
      predictions.add(const ColorPrediction(
        color: 'Unknown',
        probability: 1.0,
        geneticNotation: 'Insufficient genetic data',
      ));
      return predictions;
    }

    // Very simplified example predictions
    predictions.addAll([
      const ColorPrediction(
        color: 'Bay',
        probability: 0.4,
        geneticNotation: 'E_ A_',
      ),
      const ColorPrediction(
        color: 'Chestnut',
        probability: 0.3,
        geneticNotation: 'ee __',
      ),
      const ColorPrediction(
        color: 'Black',
        probability: 0.2,
        geneticNotation: 'E_ aa',
      ),
      const ColorPrediction(
        color: 'Other',
        probability: 0.1,
      ),
    ]);

    return predictions;
  }

  String _estimateHeight(HorseModel mare, HorseModel stallion) {
    // Simplified height estimation
    final mareBreed = mare.breed.langValue.toLowerCase();
    final stallionBreed = stallion.breed.langValue.toLowerCase();

    if (mareBreed.contains('draft') || stallionBreed.contains('draft')) {
      return '16-18 hands';
    }
    if (mareBreed.contains('warmblood') || stallionBreed.contains('warmblood')) {
      return '16-17 hands';
    }
    if (mareBreed.contains('thoroughbred') || stallionBreed.contains('thoroughbred')) {
      return '15.2-16.2 hands';
    }
    if (mareBreed.contains('quarter') || stallionBreed.contains('quarter')) {
      return '14.2-16 hands';
    }
    if (mareBreed.contains('pony')) {
      return '12-14.2 hands';
    }
    return '14.2-16.2 hands';
  }

  List<DisciplineSuitability> _predictDisciplines(
    HorseModel mare,
    HorseModel stallion,
  ) {
    final disciplines = <DisciplineSuitability>[];
    final mareBreed = mare.breed.langValue.toLowerCase();
    final stallionBreed = stallion.breed.langValue.toLowerCase();

    // Dressage
    var dressageScore = 0.5;
    if (mareBreed.contains('warmblood') || stallionBreed.contains('warmblood')) {
      dressageScore += 0.3;
    }
    disciplines.add(DisciplineSuitability(
      discipline: 'Dressage',
      suitabilityScore: dressageScore.clamp(0.0, 1.0),
      reasoning: 'Based on breed characteristics',
    ));

    // Jumping
    var jumpScore = 0.5;
    if (mareBreed.contains('thoroughbred') || stallionBreed.contains('thoroughbred')) {
      jumpScore += 0.2;
    }
    if (mareBreed.contains('warmblood') || stallionBreed.contains('warmblood')) {
      jumpScore += 0.25;
    }
    disciplines.add(DisciplineSuitability(
      discipline: 'Show Jumping',
      suitabilityScore: jumpScore.clamp(0.0, 1.0),
      reasoning: 'Based on breed characteristics',
    ));

    // Western
    var westernScore = 0.5;
    if (mareBreed.contains('quarter') || stallionBreed.contains('quarter')) {
      westernScore += 0.35;
    }
    if (mareBreed.contains('paint') || stallionBreed.contains('paint')) {
      westernScore += 0.3;
    }
    disciplines.add(DisciplineSuitability(
      discipline: 'Western',
      suitabilityScore: westernScore.clamp(0.0, 1.0),
      reasoning: 'Based on breed characteristics',
    ));

    // Eventing
    var eventingScore = 0.5;
    if (mareBreed.contains('thoroughbred') || stallionBreed.contains('thoroughbred')) {
      eventingScore += 0.3;
    }
    disciplines.add(DisciplineSuitability(
      discipline: 'Eventing',
      suitabilityScore: eventingScore.clamp(0.0, 1.0),
      reasoning: 'Based on breed characteristics',
    ));

    return disciplines..sort((a, b) => b.suitabilityScore.compareTo(a.suitabilityScore));
  }

  List<String> _predictTemperament(HorseModel mare, HorseModel stallion) {
    final traits = <String>[];
    final mareBreed = mare.breed.langValue.toLowerCase();
    final stallionBreed = stallion.breed.langValue.toLowerCase();

    if (mareBreed.contains('thoroughbred') || stallionBreed.contains('thoroughbred')) {
      traits.add('Athletic and forward-moving');
      traits.add('May be sensitive or hot');
    }
    if (mareBreed.contains('quarter') || stallionBreed.contains('quarter')) {
      traits.add('Generally calm and trainable');
      traits.add('Good work ethic');
    }
    if (mareBreed.contains('warmblood') || stallionBreed.contains('warmblood')) {
      traits.add('Steady temperament');
      traits.add('Willing learner');
    }
    if (mareBreed.contains('arabian') || stallionBreed.contains('arabian')) {
      traits.add('Intelligent and personable');
      traits.add('High energy');
    }

    if (traits.isEmpty) {
      traits.add('Temperament will depend on individual expression');
    }

    return traits;
  }

  double _calculateOverallScore(
    List<BreedingFactor> positive,
    List<BreedingFactor> negative,
    List<GeneticWarning> warnings,
  ) {
    var score = 0.5; // Base score

    for (final factor in positive) {
      score += factor.impact;
    }
    for (final factor in negative) {
      score += factor.impact; // Impact is already negative
    }

    // Heavy penalty for critical warnings
    for (final warning in warnings) {
      if (warning.riskLevel == GeneticRisk.critical) {
        score -= 0.3;
      } else if (warning.riskLevel == GeneticRisk.high) {
        score -= 0.15;
      }
    }

    return score.clamp(0.0, 1.0);
  }

  /// Finds potential stallion matches for a mare.
  List<BreedingSuggestion> findStallionMatches({
    required String barnId,
    required HorseModel mare,
    required List<HorseModel> availableStallions,
    int maxResults = 5,
    List<String>? preferredDisciplines,
  }) {
    final suggestions = <BreedingSuggestion>[];

    for (final stallion in availableStallions) {
      if (!stallion.isStud) continue;

      final suggestion = analyzeBreedingPair(
        barnId: barnId,
        mare: mare,
        stallion: stallion,
      );
      suggestions.add(suggestion);
    }

    // Sort by compatibility score
    suggestions.sort(
      (a, b) => b.overallCompatibilityScore.compareTo(a.overallCompatibilityScore),
    );

    return suggestions.take(maxResults).toList();
  }
}
