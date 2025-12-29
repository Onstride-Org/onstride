import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/ai_features/widgets/widgets.dart';
import 'package:models/models.dart';

/// Screen displaying smart scheduling suggestions and horse workload analysis.
class SmartSchedulingScreen extends StatelessWidget {
  const SmartSchedulingScreen({
    required this.suggestions,
    required this.horseAnalyses,
    this.onAcceptSuggestion,
    this.onRejectSuggestion,
    this.onRefresh,
    super.key,
  });

  final List<SchedulingSuggestion> suggestions;
  final List<HorseWorkloadAnalysis> horseAnalyses;
  final void Function(SchedulingSuggestion)? onAcceptSuggestion;
  final void Function(SchedulingSuggestion)? onRejectSuggestion;
  final VoidCallback? onRefresh;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Smart Scheduling'),
          actions: [
            if (onRefresh != null)
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: onRefresh,
                tooltip: 'Refresh Analysis',
              ),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Suggestions'),
              Tab(text: 'Workload'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Suggestions tab
            _SuggestionsTab(
              suggestions: suggestions,
              onAccept: onAcceptSuggestion,
              onReject: onRejectSuggestion,
            ),
            // Workload tab
            _WorkloadTab(analyses: horseAnalyses),
          ],
        ),
      ),
    );
  }
}

class _SuggestionsTab extends StatelessWidget {
  const _SuggestionsTab({
    required this.suggestions,
    this.onAccept,
    this.onReject,
  });

  final List<SchedulingSuggestion> suggestions;
  final void Function(SchedulingSuggestion)? onAccept;
  final void Function(SchedulingSuggestion)? onReject;

  @override
  Widget build(BuildContext context) {
    if (suggestions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.check_circle_outline,
              size: 64,
              color: GLColors.neutral400,
            ),
            GLSpaces.px16,
            Text(
              'No scheduling issues detected',
              style: context.titleMedium.copyWith(color: GLColors.neutral600),
            ),
            GLSpaces.px8,
            Text(
              'Your schedule looks optimized!',
              style: context.bodyMedium.copyWith(color: GLColors.neutral500),
            ),
          ],
        ),
      );
    }

    // Group by priority
    final critical = suggestions
        .where((s) => s.priority == SuggestionPriority.critical)
        .toList();
    final high = suggestions
        .where((s) => s.priority == SuggestionPriority.high)
        .toList();
    final other = suggestions
        .where((s) =>
            s.priority != SuggestionPriority.critical &&
            s.priority != SuggestionPriority.high)
        .toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (critical.isNotEmpty) ...[
          _SectionHeader(
            title: 'Critical',
            count: critical.length,
            color: Colors.red,
          ),
          ...critical.map((s) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: SchedulingSuggestionCard(
                  suggestion: s,
                  onAccept: onAccept != null ? () => onAccept!(s) : null,
                  onReject: onReject != null ? () => onReject!(s) : null,
                ),
              )),
          GLSpaces.px16,
        ],
        if (high.isNotEmpty) ...[
          _SectionHeader(
            title: 'High Priority',
            count: high.length,
            color: Colors.orange,
          ),
          ...high.map((s) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: SchedulingSuggestionCard(
                  suggestion: s,
                  onAccept: onAccept != null ? () => onAccept!(s) : null,
                  onReject: onReject != null ? () => onReject!(s) : null,
                ),
              )),
          GLSpaces.px16,
        ],
        if (other.isNotEmpty) ...[
          _SectionHeader(
            title: 'Other Suggestions',
            count: other.length,
            color: Colors.blue,
          ),
          ...other.map((s) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: SchedulingSuggestionCard(
                  suggestion: s,
                  onAccept: onAccept != null ? () => onAccept!(s) : null,
                  onReject: onReject != null ? () => onReject!(s) : null,
                ),
              )),
        ],
      ],
    );
  }
}

class _WorkloadTab extends StatelessWidget {
  const _WorkloadTab({required this.analyses});

  final List<HorseWorkloadAnalysis> analyses;

  @override
  Widget build(BuildContext context) {
    if (analyses.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.analytics_outlined,
              size: 64,
              color: GLColors.neutral400,
            ),
            GLSpaces.px16,
            Text(
              'No workload data available',
              style: context.titleMedium.copyWith(color: GLColors.neutral600),
            ),
            GLSpaces.px8,
            Text(
              'Add ride logs to see horse workload analysis',
              style: context.bodyMedium.copyWith(color: GLColors.neutral500),
            ),
          ],
        ),
      );
    }

    // Sort by status severity
    final sorted = [...analyses]..sort((a, b) {
        final order = {
          WorkloadStatus.overworked: 0,
          WorkloadStatus.heavy: 1,
          WorkloadStatus.normal: 2,
          WorkloadStatus.underworked: 3,
        };
        return (order[a.status] ?? 4).compareTo(order[b.status] ?? 4);
      });

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: sorted.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: HorseWorkloadCard(analysis: sorted[index]),
        );
      },
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.count,
    required this.color,
  });

  final String title;
  final int count;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 20,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          GLSpaces.px8,
          Text(
            title,
            style: context.titleSmall.copyWith(fontWeight: FontWeight.w600),
          ),
          GLSpaces.px8,
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              count.toString(),
              style: context.bodySmall.copyWith(
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
