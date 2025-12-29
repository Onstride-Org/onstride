import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/features/barns/widgets/layouts/stall_tile.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

/// Renders a With-Aisles layout from a single [BarnModel].
/// Assumes [barn.setup] is non-null when this screen is shown.
class BarnWithAislesLayout extends StatefulWidget {
  const BarnWithAislesLayout({
    required this.enabledTaps,
    required this.barn,
    required this.onTapPosition,
    required this.onTapDeleteOption,
    required this.onTapViewHorse,
    super.key,
  });

  final BarnModel barn;
  final ValueChanged<StallPosition> onTapPosition;
  final ValueChanged<StallPosition> onTapDeleteOption;
  final ValueChanged<StallPosition> onTapViewHorse;
  final bool enabledTaps;

  @override
  State<BarnWithAislesLayout> createState() => _BarnWithAislesLayoutState();
}

class _BarnWithAislesLayoutState extends State<BarnWithAislesLayout> {
  BarnSetup get _setup => widget.barn.setup!;

  int get _perAisle => (_setup.stallsPerAisle ?? 1).clamp(1, _setup.stalls);

  List<List<StallPosition>> _groupByAisle(
    List<StallPosition> stalls,
    int perAisle,
  ) {
    final result = <List<StallPosition>>[];
    for (var i = 0; i < stalls.length; i += perAisle) {
      final end = (i + perAisle).clamp(0, stalls.length);
      result.add(stalls.sublist(i, end));
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final stalls = widget.barn.stallPositions.values.toList();
    final aisles = _groupByAisle(stalls, _perAisle);
    return SingleChildScrollView(
      padding: 24.edgeInsetsH,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (var i = 0; i < aisles.length; i++) ...[
            GLSpaces.px24,
            _AisleList(
              enabled: widget.enabledTaps,
              onTapDelete: (value) => widget.onTapDeleteOption(value),
              onTapViewHorse: (value) => widget.onTapViewHorse(value),
              stalls: aisles[i],
              onTap: (s) {
                widget.onTapPosition.call(s);
              },
            ),
            GLSpaces.px16,
            if (i < aisles.length - 1) _AisleHeader(title: l10n.aisleHeader),
          ],
        ],
      ),
    );
  }
}

class _AisleHeader extends StatelessWidget {
  const _AisleHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: GLColors.neutral300A,
        borderRadius: 8.borderRadiusA,
      ),
      child: Padding(
        padding: 10.edgeInsetsA,
        child: Text(
          title,
          textAlign: TextAlign.center,
          style: context.titleSmall.copyWith(
            color: GLColors.neutral700,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

class _AisleList extends StatelessWidget {
  const _AisleList({
    required this.enabled,
    required this.stalls,
    required this.onTap,
    required this.onTapDelete,
    required this.onTapViewHorse,
  });

  final List<StallPosition> stalls;
  final ValueChanged<StallPosition> onTap;
  final ValueChanged<StallPosition> onTapDelete;
  final ValueChanged<StallPosition> onTapViewHorse;

  static const _visibleCount = 4;
  static const _spacing = 16.0;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const totalSpacing = (_visibleCount - 1) * _spacing;
        final tileSide = ((constraints.maxWidth - totalSpacing) / _visibleCount)
            .clamp(56.0, 120.0);

        return SizedBox(
          height: tileSide,
          child: OverflowBox(
            maxWidth: 1.sw,
            child: ListView.separated(
              clipBehavior: Clip.none,
              padding: 24.edgeInsetsH,
              scrollDirection: Axis.horizontal,
              physics: stalls.length > _visibleCount
                  ? const BouncingScrollPhysics()
                  : const NeverScrollableScrollPhysics(),
              itemCount: stalls.length,
              separatorBuilder: (_, __) => const SizedBox(width: _spacing),
              itemBuilder: (_, index) {
                final s = stalls[index];
                return SizedBox(
                  width: tileSide,
                  child: StallTile(
                    stall: s,
                    enabled: enabled,
                    size: Size.square(tileSide),
                    onTap: () => onTap(s),
                    onTapViewHorse: () => onTapViewHorse(s),
                    onTapDelete: () => onTapDelete(s),
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }
}

// class _AisleRow extends StatelessWidget {
//   const _AisleRow({
//     required this.stalls,
//     required this.onTap,
//     required this.onTapDelete,
//     required this.onTapViewHorse,
//   });
//
//   final List<StallPosition> stalls;
//   final ValueChanged<StallPosition> onTap;
//   final ValueChanged<StallPosition> onTapDelete;
//   final ValueChanged<StallPosition> onTapViewHorse;
//
//   @override
//   Widget build(BuildContext context) {
//     return Row(
//       spacing: 15.w,
//       children: stalls
//           .map(
//             (s) => Expanded(
//               child: StallTile(
//                 stall: s,
//                 onTap: () => onTap(s),
//                 onTapViewHorse: () => onTapViewHorse(s),
//                 onTapDelete: () => onTapDelete(s),
//               ),
//             ),
//           )
//           .toList(),
//     );
//   }
// }
