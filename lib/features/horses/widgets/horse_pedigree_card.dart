import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';

/// Displays pedigree (breeding) information for a horse.
class HorsePedigreeCard extends StatelessWidget {
  const HorsePedigreeCard({required this.horse, super.key});

  final HorseModel horse;

  @override
  Widget build(BuildContext context) {
    final hasPedigree = horse.sireName != null || horse.damName != null;

    if (!hasPedigree) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Pedigree',
                style: context.titleMedium.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              GLSpaces.px16,
              Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.family_restroom_outlined,
                      size: 48,
                      color: GLColors.neutral400,
                    ),
                    GLSpaces.px8,
                    Text(
                      'No pedigree information',
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
                  'Pedigree',
                  style: context.titleMedium.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (horse.isStud)
                  Chip(
                    label: const Text('Stud'),
                    backgroundColor: GLColors.brand100,
                    labelStyle: const TextStyle(
                      color: GLColors.brand700,
                      fontSize: 12,
                    ),
                  ),
                if (horse.isBroodmare) ...[
                  if (horse.isStud) GLSpaces.px8,
                  Chip(
                    label: const Text('Broodmare'),
                    backgroundColor: GLColors.accent100,
                    labelStyle: TextStyle(
                      color: GLColors.accent700,
                      fontSize: 12,
                    ),
                  ),
                ],
              ],
            ),
            GLSpaces.px16,

            // Pedigree Tree (simplified 3-generation view)
            _PedigreeTree(horse: horse),

            // Color Genetics
            if (horse.colorGenetics != null) ...[
              GLSpaces.px16,
              const Divider(),
              GLSpaces.px8,
              Row(
                children: [
                  Icon(Icons.palette_outlined,
                      size: 20, color: GLColors.neutral600),
                  GLSpaces.px8,
                  Text(
                    'Color Genetics:',
                    style: context.bodyMedium.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  GLSpaces.px8,
                  Text(
                    horse.colorGenetics!,
                    style: context.bodyMedium.copyWith(
                      fontFamily: 'monospace',
                      color: GLColors.brand600,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PedigreeTree extends StatelessWidget {
  const _PedigreeTree({required this.horse});

  final HorseModel horse;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Sire side
        _PedigreeRow(
          label: 'Sire',
          name: horse.sireName,
          grandparents: [
            horse.paternalGrandsireName,
            horse.paternalGranddamName,
          ],
        ),
        GLSpaces.px12,
        // Dam side
        _PedigreeRow(
          label: 'Dam',
          name: horse.damName,
          grandparents: [
            horse.maternalGrandsireName,
            horse.maternalGranddamName,
          ],
        ),
      ],
    );
  }
}

class _PedigreeRow extends StatelessWidget {
  const _PedigreeRow({
    required this.label,
    required this.name,
    required this.grandparents,
  });

  final String label;
  final String? name;
  final List<String?> grandparents;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Parent
        SizedBox(
          width: 100,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: context.bodySmall.copyWith(
                  color: GLColors.neutral500,
                ),
              ),
              Text(
                name ?? 'Unknown',
                style: context.bodyMedium.copyWith(
                  fontWeight: FontWeight.w500,
                  color: name != null ? null : GLColors.neutral400,
                ),
              ),
            ],
          ),
        ),
        GLSpaces.px16,
        // Grandparents
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (grandparents[0] != null)
                Text(
                  grandparents[0]!,
                  style: context.bodySmall,
                ),
              if (grandparents[1] != null)
                Text(
                  grandparents[1]!,
                  style: context.bodySmall.copyWith(
                    fontStyle: FontStyle.italic,
                  ),
                ),
              if (grandparents[0] == null && grandparents[1] == null)
                Text(
                  'Unknown',
                  style: context.bodySmall.copyWith(
                    color: GLColors.neutral400,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
