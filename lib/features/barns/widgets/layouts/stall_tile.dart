import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/barns/widgets/layouts/layouts.dart';
import 'package:gl_horses/features/features.dart';
import 'package:models/models.dart';

class StallTile extends ConsumerWidget {
  const StallTile({
    required this.stall,
    required this.onTap,
    required this.onTapViewHorse,
    required this.onTapDelete,
    required this.enabled,
    this.size,
    super.key,
  });

  final StallPosition stall;
  final VoidCallback onTap;
  final Size? size;
  final VoidCallback onTapViewHorse;
  final VoidCallback onTapDelete;
  final bool enabled;
  static const _radius = 12.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final horseId = stall.horseId;
    final hasHorse = horseId != null;
    const dashedBorderColor = GLColors.neutral1000;
    const pillBg = GLColors.neutral150A;
    final tileSize = size ?? const Size(72, 72);
    final horse = ref.watch(fetchHorsesProvider).getHorseById(horseId);
    final tileChild = SizedBox(
      width: tileSize.width,
      height: tileSize.height,
      child: Center(
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: hasHorse ? null : pillBg,
            borderRadius: 99.borderRadiusA,
          ),
          child: Padding(
            padding: [14, 2].edgeInsetsHV,
            child: Text(
              horse?.name ?? stall.stallName,
              textAlign: TextAlign.center,
              style: theme.textTheme.labelMedium?.copyWith(
                color: hasHorse ? GLColors.neutral1100 : GLColors.neutral700,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ),
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: 12.borderRadiusA,
        onTap: enabled
            ? hasHorse
                  ? null
                  : onTap
            : null,
        child: hasHorse
            ? SizedBox.fromSize(
                size: tileSize,
                child: HorseStallPopupMenu(
                  enabled: enabled,
                  onTapViewHorse: onTapViewHorse,
                  onTapDelete: onTapDelete,
                  child: Container(
                    width: tileSize.width,
                    height: tileSize.height,
                    decoration: BoxDecoration(
                      color: GLColors.brand500,
                      borderRadius: 12.borderRadiusA,
                    ),
                    child: tileChild,
                  ),
                ),
              )
            : DashedBorderContainer(
                width: tileSize.width,
                height: tileSize.height,
                color: dashedBorderColor,
                radius: _radius,
                child: tileChild,
              ),
      ),
    );
  }
}
