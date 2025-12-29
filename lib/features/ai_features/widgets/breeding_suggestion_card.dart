import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';

/// Card displaying a breeding suggestion with compatibility analysis.
class BreedingSuggestionCard extends StatelessWidget {
  const BreedingSuggestionCard({
    required this.suggestion,
    this.onViewDetails,
    this.onSave,
    super.key,
  });

  final BreedingSuggestion suggestion;
  final VoidCallback? onViewDetails;
  final VoidCallback? onSave;

  @override
  Widget build(BuildContext context) {
    final scoreColor = _getScoreColor(suggestion.overallCompatibilityScore);

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with score
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: scoreColor.withOpacity(0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                _CompatibilityScore(score: suggestion.overallCompatibilityScore),
                GLSpaces.px16,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Breeding Analysis',
                        style: context.titleSmall.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      GLSpaces.px4,
                      Text(
                        _getScoreLabel(suggestion.overallCompatibilityScore),
                        style: context.bodySmall.copyWith(color: scoreColor),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Mare & Stallion info
                Row(
                  children: [
                    Expanded(
                      child: _HorseInfo(
                        label: 'Mare',
                        name: suggestion.mareName,
                        breed: suggestion.mareBreed,
                        icon: Icons.female,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(8),
                      child: const Icon(Icons.close, color: GLColors.neutral400),
                    ),
                    Expanded(
                      child: _HorseInfo(
                        label: 'Stallion',
                        name: suggestion.stallionName,
                        breed: suggestion.stallionBreed,
                        icon: Icons.male,
                      ),
                    ),
                  ],
                ),

                // Genetic Warnings
                if (suggestion.geneticWarnings.isNotEmpty) ...[
                  GLSpaces.px16,
                  _GeneticWarningsSection(warnings: suggestion.geneticWarnings),
                ],

                // Factors summary
                GLSpaces.px16,
                _FactorsSummary(
                  positive: suggestion.positiveFactors.length,
                  negative: suggestion.negativeFactors.length,
                  neutral: suggestion.neutralFactors.length,
                ),

                // Offspring prediction preview
                if (suggestion.offspringPrediction != null) ...[
                  GLSpaces.px16,
                  _OffspringPreview(prediction: suggestion.offspringPrediction!),
                ],

                // Actions
                GLSpaces.px16,
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (onViewDetails != null)
                      TextButton(
                        onPressed: onViewDetails,
                        child: const Text('View Details'),
                      ),
                    GLSpaces.px8,
                    if (onSave != null)
                      FilledButton.icon(
                        onPressed: onSave,
                        icon: const Icon(Icons.bookmark_outline, size: 18),
                        label: const Text('Save'),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getScoreColor(double score) {
    if (score >= 0.7) return Colors.green;
    if (score >= 0.5) return Colors.orange;
    return Colors.red;
  }

  String _getScoreLabel(double score) {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.7) return 'Good Match';
    if (score >= 0.5) return 'Moderate Match';
    if (score >= 0.3) return 'Fair Match';
    return 'Poor Match';
  }
}

class _CompatibilityScore extends StatelessWidget {
  const _CompatibilityScore({required this.score});

  final double score;

  @override
  Widget build(BuildContext context) {
    final color = score >= 0.7
        ? Colors.green
        : score >= 0.5
            ? Colors.orange
            : Colors.red;

    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: color, width: 3),
      ),
      child: Center(
        child: Text(
          '${(score * 100).toInt()}%',
          style: context.titleMedium.copyWith(
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ),
    );
  }
}

class _HorseInfo extends StatelessWidget {
  const _HorseInfo({
    required this.label,
    required this.name,
    required this.icon,
    this.breed,
  });

  final String label;
  final String name;
  final String? breed;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: GLColors.neutral100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: GLColors.neutral600, size: 20),
          GLSpaces.px4,
          Text(
            label,
            style: context.bodySmall.copyWith(color: GLColors.neutral500),
          ),
          GLSpaces.px4,
          Text(
            name,
            style: context.bodyMedium.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          if (breed != null)
            Text(
              breed!,
              style: context.bodySmall.copyWith(color: GLColors.neutral600),
              textAlign: TextAlign.center,
            ),
        ],
      ),
    );
  }
}

class _GeneticWarningsSection extends StatelessWidget {
  const _GeneticWarningsSection({required this.warnings});

  final List<GeneticWarning> warnings;

  @override
  Widget build(BuildContext context) {
    final criticalWarnings = warnings
        .where((w) => w.riskLevel == GeneticRisk.critical || w.riskLevel == GeneticRisk.high)
        .toList();

    if (criticalWarnings.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning, color: Colors.red, size: 20),
              GLSpaces.px8,
              Text(
                'Genetic Warnings',
                style: context.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.red[800],
                ),
              ),
            ],
          ),
          GLSpaces.px8,
          ...criticalWarnings.map((warning) => Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 6),
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                    GLSpaces.px8,
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            warning.condition,
                            style: context.bodySmall.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            warning.description,
                            style: context.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}

class _FactorsSummary extends StatelessWidget {
  const _FactorsSummary({
    required this.positive,
    required this.negative,
    required this.neutral,
  });

  final int positive;
  final int negative;
  final int neutral;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _FactorChip(
          count: positive,
          label: 'Positive',
          color: Colors.green,
          icon: Icons.add_circle_outline,
        ),
        GLSpaces.px8,
        _FactorChip(
          count: negative,
          label: 'Concerns',
          color: Colors.red,
          icon: Icons.remove_circle_outline,
        ),
        GLSpaces.px8,
        _FactorChip(
          count: neutral,
          label: 'Neutral',
          color: Colors.grey,
          icon: Icons.info_outline,
        ),
      ],
    );
  }
}

class _FactorChip extends StatelessWidget {
  const _FactorChip({
    required this.count,
    required this.label,
    required this.color,
    required this.icon,
  });

  final int count;
  final String label;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          GLSpaces.px4,
          Text(
            '$count $label',
            style: context.bodySmall.copyWith(color: color),
          ),
        ],
      ),
    );
  }
}

class _OffspringPreview extends StatelessWidget {
  const _OffspringPreview({required this.prediction});

  final OffspringPrediction prediction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: GLColors.brand50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Offspring Predictions',
            style: context.bodySmall.copyWith(
              fontWeight: FontWeight.w600,
              color: GLColors.brand700,
            ),
          ),
          GLSpaces.px8,
          if (prediction.possibleColors.isNotEmpty)
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: prediction.possibleColors
                  .take(3)
                  .map((c) => Chip(
                        label: Text('${c.color} (${(c.probability * 100).toInt()}%)'),
                        visualDensity: VisualDensity.compact,
                        backgroundColor: Colors.white,
                      ))
                  .toList(),
            ),
          if (prediction.estimatedHeightRange != null) ...[
            GLSpaces.px8,
            Row(
              children: [
                const Icon(Icons.height, size: 16, color: GLColors.neutral600),
                GLSpaces.px4,
                Text(
                  'Est. height: ${prediction.estimatedHeightRange}',
                  style: context.bodySmall,
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
