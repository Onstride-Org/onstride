import 'dart:math';
import 'dart:ui';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/common/constants/constants.dart';
import 'package:gl_horses/features/barns/widgets/layouts/horse_stall_popup_menu.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class BarnCircularStackLayout extends StatelessWidget {
  const BarnCircularStackLayout({
    required this.enabledTaps,
    required this.barn,
    required this.onTapPosition,
    required this.onTapDeleteOption,
    required this.onTapViewHorse,
    super.key,
    this.horseNameResolver,
    this.stallSize,
    this.circleRadiusFactor = 0.70,
    this.startAngle = -pi / 2,
    this.ringGap = 12,
  }) : assert(
         circleRadiusFactor > 0 && circleRadiusFactor <= 1,
         'circleRadiusFactor must be in (0, 1]',
       );

  final BarnModel barn;
  final ValueChanged<StallPosition> onTapPosition;
  final ValueChanged<StallPosition> onTapDeleteOption;
  final ValueChanged<StallPosition> onTapViewHorse;
  final String? Function(String horseId)? horseNameResolver;
  final double ringGap;
  final bool enabledTaps;

  /// Rect size for each stall (width x height).
  final Size? stallSize;

  /// Circle radius factor relative to the shortest side of the box.
  final double circleRadiusFactor;

  /// Angle offset for the first stall in radians.
  final double startAngle;

  BarnSetup get _setup => barn.setup!;

  int get _count => _setup.stalls;

  StallPosition _positionFor(int index) {
    final pos = barn.stallPositions[index];
    if (pos != null) return pos;
    return StallPosition(id: index, stallName: 'S${index + 1}');
  }

  double calculateStallWidth({
    required int n,
    required int minStalls,
    required int maxStalls,
    double minWidth = 14,
    double maxWidth = 52,
  }) {
    if (n <= minStalls) return maxWidth;
    if (n >= maxStalls) return minWidth;

    final t = (n - minStalls) / (maxStalls - minStalls);
    return maxWidth - t * (maxWidth - minWidth);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    final occupied = <int, String>{};
    for (final entry in barn.stallPositions.entries) {
      final pos = entry.value;
      if (pos.horseId != null) {
        occupied[entry.key] =
            horseNameResolver?.call(pos.horseId!) ?? pos.stallName;
      }
    }

    return Center(
      child: Padding(
        padding: 24.edgeInsetsH,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final side = min(constraints.maxWidth, constraints.maxHeight);
            final size = Size.square(side);
            final center = Offset(size.width / 2, size.height * 0.45);
            final base = min(size.width, size.height);
            final baseRadius = base * circleRadiusFactor * 0.40;
            // final w2 = calculateStallWidth(
            //   n: barn.setup!.stalls,
            //   minStalls: 1,
            //   maxStalls: 40,
            // );
            final w2 =
                lerpDouble(36, 14, barn.setup!.stalls / maxAisleStallNumber) ??
                32;
            final stallSizeFallback = stallSize ?? Size(w2.w, 80.h);
            final ringRadius =
                baseRadius + ringGap + stallSizeFallback.height / 2;
            final step = 2 * pi / max(1, _count);

            final children = <Widget>[
              Positioned.fill(
                child: CustomPaint(
                  painter: _CenterDiscPainter(
                    center: center,
                    radius: baseRadius,
                    theme: Theme.of(context),
                    label: l10n.centerArea,
                  ),
                ),
              ),
            ];

            for (var i = 0; i < _count; i++) {
              final angle = startAngle + i * step;
              final stallCenter = Offset(
                center.dx + cos(angle) * ringRadius,
                center.dy + sin(angle) * ringRadius,
              );

              final pos = _positionFor(i);
              final isOccupied = pos.horseId != null;
              final label = isOccupied
                  ? (occupied[i] ?? pos.stallName)
                  : pos.stallName;

              final flip = i >= (_count / 2).floor();
              final quarterTurns = flip || i == 0 ? 1 : 3;

              children.add(
                Positioned(
                  left: stallCenter.dx - stallSizeFallback.width / 2,
                  top: stallCenter.dy - stallSizeFallback.height / 2,
                  width: stallSizeFallback.width,
                  height: stallSizeFallback.height,
                  child: Transform.rotate(
                    angle: angle + pi / 2,
                    child: _CircularStallTile(
                      enabled: enabledTaps,
                      label: label,
                      occupied: isOccupied,
                      size: stallSizeFallback,
                      quarterTurns: quarterTurns,
                      onTapDelete: () => onTapDeleteOption(pos),
                      onTapViewHorse: () => onTapViewHorse(pos),
                      onTap: () => onTapPosition(pos),
                    ),
                  ),
                ),
              );
            }

            return AspectRatio(
              aspectRatio: 1,
              child: Stack(
                clipBehavior: Clip.none,
                children: children,
              ),
            );
          },
        ),
      ),
    );
  }
}

class _CenterDiscPainter extends CustomPainter {
  _CenterDiscPainter({
    required this.center,
    required this.radius,
    required this.theme,
    required this.label,
  });

  final Offset center;
  final double radius;
  final ThemeData theme;
  final String label;

  @override
  void paint(Canvas canvas, Size size) {
    final fill = Paint()
      ..color = theme.colorScheme.primary.withOpacity(0.06)
      ..style = PaintingStyle.fill;
    final stroke = Paint()
      ..color = theme.colorScheme.primary.withOpacity(0.12)
      ..style = PaintingStyle.stroke;

    canvas
      ..drawCircle(center, radius, fill)
      ..drawCircle(center, radius, stroke);

    final tp = TextPainter(
      text: TextSpan(
        text: label,
        style: theme.textTheme.bodyMedium?.copyWith(
          color: theme.colorScheme.onSurface.withOpacity(0.55),
        ),
      ),
      textDirection: TextDirection.ltr,
      maxLines: 1,
      ellipsis: '…',
    )..layout(maxWidth: radius * 1.6);
    tp.paint(canvas, center - Offset(tp.width / 2, tp.height / 2));
  }

  @override
  bool shouldRepaint(covariant _CenterDiscPainter oldDelegate) {
    return center != oldDelegate.center ||
        radius != oldDelegate.radius ||
        label != oldDelegate.label;
  }
}

/// Single stall widget (occupied: solid; empty: dashed).
class _CircularStallTile extends StatelessWidget {
  const _CircularStallTile({
    required this.enabled,
    required this.label,
    required this.occupied,
    required this.size,
    required this.quarterTurns,
    required this.onTap,
    required this.onTapViewHorse,
    required this.onTapDelete,
  });

  final String label;
  final bool occupied;
  final bool enabled;
  final Size size;
  final int quarterTurns;
  final VoidCallback onTap;
  final VoidCallback onTapViewHorse;
  final VoidCallback onTapDelete;
  static const _radius = 8.0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tileChild = Center(
      child: RotatedBox(
        quarterTurns: quarterTurns,
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: theme.textTheme.labelSmall?.copyWith(
            color: occupied
                ? Colors.white
                : theme.colorScheme.onSurface.withOpacity(0.45),
            fontWeight: occupied ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: 12.borderRadiusA,
        onTap: enabled
            ? occupied
                  ? null
                  : onTap
            : null,
        child: occupied
            ? HorseStallPopupMenu(
                enabled: enabled,
                onTapViewHorse: onTapViewHorse,
                onTapDelete: onTapDelete,
                child: Container(
                  width: size.width,
                  height: size.height,
                  decoration: BoxDecoration(
                    color: GLColors.brand500,
                    borderRadius: BorderRadius.circular(_radius),
                  ),
                  child: tileChild,
                ),
              )
            : _DashedRect(
                size: size,
                radius: _radius,
                color: theme.colorScheme.onSurface.withOpacity(0.28),
                background: theme.colorScheme.onSurface.withOpacity(0.02),
                child: tileChild,
              ),
      ),
    );
  }
}

/// Dashed rounded rect used for empty stalls.
/// This avoids external dependencies; you can swap for your own Dotted widget.
class _DashedRect extends StatelessWidget {
  const _DashedRect({
    required this.size,
    required this.radius,
    required this.color,
    required this.background,
    required this.child,
    this.strokeWidth = 1.2,
    this.dash = 6,
    this.gap = 5,
  });

  final Size size;
  final double radius;
  final double strokeWidth;
  final double dash;
  final double gap;
  final Color color;
  final Color background;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedRectPainter(
        radius: radius,
        color: color,
        background: background,
        strokeWidth: strokeWidth,
        dash: dash,
        gap: gap,
      ),
      child: SizedBox(width: size.width, height: size.height, child: child),
    );
  }
}

class _DashedRectPainter extends CustomPainter {
  _DashedRectPainter({
    required this.radius,
    required this.color,
    required this.background,
    required this.strokeWidth,
    required this.dash,
    required this.gap,
  });

  final double radius;
  final Color color;
  final Color background;
  final double strokeWidth;
  final double dash;
  final double gap;

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(radius),
    );

    final fill = Paint()
      ..color = background
      ..style = PaintingStyle.fill;
    canvas.drawRRect(rrect, fill);

    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final path = Path()..addRRect(rrect);
    for (final metric in path.computeMetrics()) {
      double dist = 0;
      while (dist < metric.length) {
        final next = (dist + dash).clamp(0, metric.length);
        canvas.drawPath(metric.extractPath(dist, next.toDouble()), stroke);
        dist = next + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRectPainter old) {
    return radius != old.radius ||
        color != old.color ||
        background != old.background ||
        strokeWidth != old.strokeWidth ||
        dash != old.dash ||
        gap != old.gap;
  }
}

// Positive modulo helper
extension on num {
  int mod(int n) => ((toInt() % n) + n) % n;
}
