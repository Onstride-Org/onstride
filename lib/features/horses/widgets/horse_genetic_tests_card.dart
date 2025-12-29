import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';

/// Displays genetic test results for a horse.
class HorseGeneticTestsCard extends StatelessWidget {
  const HorseGeneticTestsCard({required this.horse, super.key});

  final HorseModel horse;

  @override
  Widget build(BuildContext context) {
    final tests = horse.geneticTests;

    if (tests.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Genetic Tests',
                style: context.titleMedium.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              GLSpaces.px16,
              Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.biotech_outlined,
                      size: 48,
                      color: GLColors.neutral400,
                    ),
                    GLSpaces.px8,
                    Text(
                      'No genetic test results',
                      style: context.bodyMedium.copyWith(
                        color: GLColors.neutral500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Genetic Tests',
                  style: context.titleMedium.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Chip(
                  label: Text('${tests.length} test${tests.length > 1 ? 's' : ''}'),
                  backgroundColor: GLColors.neutral100,
                  labelStyle: TextStyle(
                    color: GLColors.neutral700,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            GLSpaces.px16,
            ...tests.map((test) => _GeneticTestRow(test: test)),
          ],
        ),
      ),
    );
  }
}

class _GeneticTestRow extends StatelessWidget {
  const _GeneticTestRow({required this.test});

  final GeneticTestResult test;

  @override
  Widget build(BuildContext context) {
    final resultColor = _getResultColor(test.result);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Test name
          SizedBox(
            width: 80,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  test.testName,
                  style: context.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (test.testDate != null)
                  Text(
                    _formatDate(test.testDate!),
                    style: context.bodySmall.copyWith(
                      color: GLColors.neutral500,
                    ),
                  ),
              ],
            ),
          ),
          GLSpaces.px16,
          // Result
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: resultColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: resultColor.withOpacity(0.3)),
            ),
            child: Text(
              test.result,
              style: context.bodySmall.copyWith(
                fontFamily: 'monospace',
                fontWeight: FontWeight.w600,
                color: resultColor,
              ),
            ),
          ),
          GLSpaces.px16,
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (test.laboratory != null)
                  Text(
                    test.laboratory!,
                    style: context.bodySmall.copyWith(
                      color: GLColors.neutral600,
                    ),
                  ),
                if (test.notes != null)
                  Text(
                    test.notes!,
                    style: context.bodySmall.copyWith(
                      fontStyle: FontStyle.italic,
                      color: GLColors.neutral500,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getResultColor(String result) {
    final lowerResult = result.toLowerCase();
    // Negative/Clear results (good)
    if (lowerResult.contains('n/n') ||
        lowerResult.contains('negative') ||
        lowerResult.contains('clear')) {
      return Colors.green;
    }
    // Carrier results (warning)
    if (lowerResult.contains('n/h') ||
        lowerResult.contains('carrier') ||
        lowerResult.contains('n/o')) {
      return Colors.orange;
    }
    // Positive/Affected results (alert)
    if (lowerResult.contains('h/h') ||
        lowerResult.contains('positive') ||
        lowerResult.contains('affected') ||
        lowerResult.contains('o/o')) {
      return Colors.red;
    }
    // Default neutral
    return GLColors.neutral600;
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}
