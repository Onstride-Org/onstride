import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/ai_features/widgets/widgets.dart';
import 'package:models/models.dart';

/// Screen for AI-powered breeding analysis.
class BreedingAnalysisScreen extends StatelessWidget {
  const BreedingAnalysisScreen({
    required this.mares,
    required this.stallions,
    required this.suggestions,
    this.selectedMare,
    this.selectedStallion,
    this.onSelectMare,
    this.onSelectStallion,
    this.onAnalyze,
    this.onFindMatches,
    this.onSaveSuggestion,
    super.key,
  });

  final List<HorseModel> mares;
  final List<HorseModel> stallions;
  final List<BreedingSuggestion> suggestions;
  final HorseModel? selectedMare;
  final HorseModel? selectedStallion;
  final void Function(HorseModel)? onSelectMare;
  final void Function(HorseModel)? onSelectStallion;
  final VoidCallback? onAnalyze;
  final VoidCallback? onFindMatches;
  final void Function(BreedingSuggestion)? onSaveSuggestion;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Breeding Analysis'),
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline),
            onPressed: () => _showHelpDialog(context),
            tooltip: 'About Breeding Analysis',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Selection section
          _SelectionCard(
            mares: mares,
            stallions: stallions,
            selectedMare: selectedMare,
            selectedStallion: selectedStallion,
            onSelectMare: onSelectMare,
            onSelectStallion: onSelectStallion,
          ),

          GLSpaces.px16,

          // Action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: selectedMare != null && onFindMatches != null
                      ? onFindMatches
                      : null,
                  icon: const Icon(Icons.search),
                  label: const Text('Find Matches'),
                ),
              ),
              GLSpaces.px12,
              Expanded(
                child: FilledButton.icon(
                  onPressed: selectedMare != null &&
                          selectedStallion != null &&
                          onAnalyze != null
                      ? onAnalyze
                      : null,
                  icon: const Icon(Icons.analytics),
                  label: const Text('Analyze'),
                ),
              ),
            ],
          ),

          GLSpaces.px24,

          // Results section
          if (suggestions.isNotEmpty) ...[
            Text(
              'Analysis Results',
              style: context.titleMedium.copyWith(fontWeight: FontWeight.bold),
            ),
            GLSpaces.px12,
            ...suggestions.map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: BreedingSuggestionCard(
                    suggestion: s,
                    onSave: onSaveSuggestion != null
                        ? () => onSaveSuggestion!(s)
                        : null,
                  ),
                )),
          ] else ...[
            _EmptyResults(),
          ],
        ],
      ),
    );
  }

  void _showHelpDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('AI Breeding Analysis'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This tool helps you:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('• Analyze breeding compatibility'),
            Text('• Predict genetic outcomes'),
            Text('• Identify health risks'),
            Text('• Find optimal stallion matches'),
            SizedBox(height: 16),
            Text(
              'How to use:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('1. Select a mare from your barn'),
            Text('2. Select a stallion or use "Find Matches"'),
            Text('3. Review the AI analysis'),
            Text('4. Save promising pairings'),
            SizedBox(height: 16),
            Text(
              'Note: For best results, ensure horses have genetic test '
              'results and color genetics entered in their profiles.',
              style: TextStyle(fontStyle: FontStyle.italic, fontSize: 12),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }
}

class _SelectionCard extends StatelessWidget {
  const _SelectionCard({
    required this.mares,
    required this.stallions,
    this.selectedMare,
    this.selectedStallion,
    this.onSelectMare,
    this.onSelectStallion,
  });

  final List<HorseModel> mares;
  final List<HorseModel> stallions;
  final HorseModel? selectedMare;
  final HorseModel? selectedStallion;
  final void Function(HorseModel)? onSelectMare;
  final void Function(HorseModel)? onSelectStallion;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Select Breeding Pair',
              style: context.titleSmall.copyWith(fontWeight: FontWeight.w600),
            ),
            GLSpaces.px16,
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Mare selection
                Expanded(
                  child: _HorseSelector(
                    label: 'Mare',
                    icon: Icons.female,
                    horses: mares,
                    selectedHorse: selectedMare,
                    onSelect: onSelectMare,
                    emptyMessage: 'No broodmares available',
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
                  child: Icon(
                    Icons.close,
                    color: GLColors.neutral400,
                  ),
                ),
                // Stallion selection
                Expanded(
                  child: _HorseSelector(
                    label: 'Stallion',
                    icon: Icons.male,
                    horses: stallions,
                    selectedHorse: selectedStallion,
                    onSelect: onSelectStallion,
                    emptyMessage: 'No studs available',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _HorseSelector extends StatelessWidget {
  const _HorseSelector({
    required this.label,
    required this.icon,
    required this.horses,
    required this.emptyMessage,
    this.selectedHorse,
    this.onSelect,
  });

  final String label;
  final IconData icon;
  final List<HorseModel> horses;
  final HorseModel? selectedHorse;
  final void Function(HorseModel)? onSelect;
  final String emptyMessage;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: GLColors.neutral600),
            GLSpaces.px4,
            Text(
              label,
              style: context.bodySmall.copyWith(color: GLColors.neutral600),
            ),
          ],
        ),
        GLSpaces.px8,
        if (horses.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: GLColors.neutral100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                emptyMessage,
                style: context.bodySmall.copyWith(color: GLColors.neutral500),
                textAlign: TextAlign.center,
              ),
            ),
          )
        else
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: GLColors.neutral300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<HorseModel>(
                value: selectedHorse,
                hint: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text('Select $label'),
                ),
                isExpanded: true,
                items: horses.map((horse) {
                  return DropdownMenuItem(
                    value: horse,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            horse.name,
                            style: context.bodyMedium,
                          ),
                          Text(
                            horse.breed.langValue,
                            style: context.bodySmall.copyWith(
                              color: GLColors.neutral500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
                onChanged: (horse) {
                  if (horse != null && onSelect != null) {
                    onSelect!(horse);
                  }
                },
              ),
            ),
          ),
        if (selectedHorse != null) ...[
          GLSpaces.px8,
          _SelectedHorseInfo(horse: selectedHorse!),
        ],
      ],
    );
  }
}

class _SelectedHorseInfo extends StatelessWidget {
  const _SelectedHorseInfo({required this.horse});

  final HorseModel horse;

  @override
  Widget build(BuildContext context) {
    final hasGeneticInfo =
        horse.colorGenetics != null || horse.geneticTests.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: hasGeneticInfo ? GLColors.brand50 : Colors.orange.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (horse.colorGenetics != null)
            Row(
              children: [
                const Icon(Icons.palette, size: 14, color: GLColors.neutral600),
                GLSpaces.px4,
                Text(
                  horse.colorGenetics!,
                  style: context.bodySmall.copyWith(fontFamily: 'monospace'),
                ),
              ],
            ),
          if (horse.geneticTests.isNotEmpty)
            Row(
              children: [
                const Icon(Icons.biotech, size: 14, color: GLColors.neutral600),
                GLSpaces.px4,
                Text(
                  '${horse.geneticTests.length} genetic test(s)',
                  style: context.bodySmall,
                ),
              ],
            ),
          if (!hasGeneticInfo)
            Row(
              children: [
                Icon(Icons.info_outline, size: 14, color: Colors.orange[700]),
                GLSpaces.px4,
                Expanded(
                  child: Text(
                    'No genetic data - add for better analysis',
                    style: context.bodySmall.copyWith(color: Colors.orange[700]),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _EmptyResults extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: GLColors.neutral100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(
            Icons.pets,
            size: 64,
            color: GLColors.neutral400,
          ),
          GLSpaces.px16,
          Text(
            'Select a breeding pair to analyze',
            style: context.bodyMedium.copyWith(color: GLColors.neutral600),
            textAlign: TextAlign.center,
          ),
          GLSpaces.px8,
          Text(
            'Or use "Find Matches" to discover optimal pairings for your mare',
            style: context.bodySmall.copyWith(color: GLColors.neutral500),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
