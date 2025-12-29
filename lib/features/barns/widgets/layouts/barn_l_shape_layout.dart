import 'dart:math';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/features/barns/widgets/layouts/stall_tile.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class BarnLShapeLayout extends StatelessWidget {
  const BarnLShapeLayout({
    required this.barn,
    required this.onTapPosition,
    required this.onTapDeleteOption,
    required this.onTapViewHorse,
    required this.enabledTaps,
    this.tileSize = const Size(100, 72),
    this.spacing = 12.0,
    super.key,
  });

  final BarnModel barn;
  final ValueChanged<StallPosition> onTapPosition;
  final ValueChanged<StallPosition> onTapDeleteOption;
  final ValueChanged<StallPosition> onTapViewHorse;
  final bool enabledTaps;

  final Size tileSize;

  final double spacing;

  BarnSetup get _setup => barn.setup!;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    final vCount = max(0, _setup.verticalStalls ?? 0);
    final hCount = max(0, _setup.horizontalStalls ?? 0);

    final ordered = barn.stallPositions.values.toList()
      ..sort((a, b) => a.id.compareTo(b.id));

    List<StallPosition> _fill(int start, int total) =>
        List.generate(total, (i) {
          final id = start + i;
          return barn.stallPositions[id] ??
              StallPosition(id: id, stallName: 'S${id + 1}');
        });

    final vertical = ordered.length >= vCount
        ? ordered.take(vCount).toList()
        : _fill(0, vCount);

    final horizontal = ordered.length >= vCount + hCount
        ? ordered.sublist(vCount, vCount + hCount)
        : _fill(vCount, hCount);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: 24.edgeInsetsH,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (int i = 0; i < vertical.length; i++) ...[
                      StallTile(
                        enabled: enabledTaps,
                        stall: vertical[i],
                        size: tileSize,
                        onTapViewHorse: () => onTapViewHorse(vertical[i]),
                        onTapDelete: () => onTapDeleteOption(vertical[i]),
                        onTap: () => onTapPosition(vertical[i]),
                      ),
                      if (i != vertical.length - 1) SizedBox(height: spacing),
                    ],
                  ],
                ),
                SizedBox(height: spacing),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  clipBehavior: Clip.none,
                  child: Row(
                    children: [
                      for (int j = 0; j < horizontal.length; j++) ...[
                        StallTile(
                          enabled: enabledTaps,
                          stall: horizontal[j],
                          size: tileSize,
                          onTapViewHorse: () => onTapViewHorse(horizontal[j]),
                          onTapDelete: () => onTapDeleteOption(horizontal[j]),
                          onTap: () => onTapPosition(horizontal[j]),
                        ),
                        if (j != horizontal.length - 1)
                          SizedBox(width: spacing),
                      ],
                    ],
                  ),
                ),
                GLSpaces.px40,
              ],
            ),
          ),
        ),
      ],
    );
  }
}
