import 'dart:math';

import 'package:flutter/material.dart';

class BarnCircleLayout extends StatefulWidget {
  const BarnCircleLayout({
    required this.stallCount,
    this.centerLabel = 'Center area',
    this.occupied,
    this.selectedIndex,
    this.onTapStall,
    this.size = const Size(340, 420),
    super.key,
  });

  final int stallCount;
  final String centerLabel;
  final Map<int, String>? occupied;
  final int? selectedIndex;
  final ValueChanged<int>? onTapStall;
  final Size size;

  @override
  State<BarnCircleLayout> createState() => _BarnCircleLayoutState();
}

class _BarnCircleLayoutState extends State<BarnCircleLayout> {
  void _handleTapDown(TapDownDetails details, Size size) {
    final local = details.localPosition;
    final cx = size.width / 2;
    final cy = size.height / 2;
    final dx = local.dx - cx;
    final dy = local.dy - cy;
    final r = sqrt(dx * dx + dy * dy);
    final angle = (atan2(dy, dx) + 2 * pi) % (2 * pi);

    // Geometría del anillo donde viven los stalls
    final outerR = min(size.width, size.height) * 0.42;
    final innerR = outerR - 80; // altura aproximada del stall

    // Si tocó fuera del anillo, ignora
    if (r < innerR || r > outerR + 40) return;

    // Índice por ángulo
    final step = 2 * pi / widget.stallCount;
    int index = ((angle) / step).round() % widget.stallCount;

    widget.onTapStall?.call(index);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (d) => _handleTapDown(d, widget.size),
      child: CustomPaint(
        size: widget.size,
        painter: _StablePainter(
          stallCount: widget.stallCount,
          centerLabel: widget.centerLabel,
          occupied: widget.occupied ?? const {},
          selectedIndex: widget.selectedIndex,
          theme: Theme.of(context),
        ),
      ),
    );
  }
}

class _StablePainter extends CustomPainter {
  _StablePainter({
    required this.stallCount,
    required this.centerLabel,
    required this.occupied,
    required this.selectedIndex,
    required this.theme,
  });

  final int stallCount;
  final String centerLabel;
  final Map<int, String> occupied;
  final int? selectedIndex;
  final ThemeData theme;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.45);
    final radius = min(size.width, size.height) * 0.28;
    final stallSize = const Size(28, 78); // ancho x alto del rect del stall
    final step = 2 * pi / stallCount;

    // 1) Center area
    _drawCenterCircle(canvas, center, radius * 0.95);

    // 2) Stalls (distribución circular)
    for (int i = 0; i < stallCount; i++) {
      final angle = i * step - pi / 2; // arranca arriba (12 en punto)
      final position = center + Offset(cos(angle), sin(angle)) * (radius + 30);
      final rectCenter = position;
      final isSelected = (selectedIndex != null && selectedIndex == i);
      final isOccupied = occupied.containsKey(i);
      final label = isOccupied ? (occupied[i] ?? '') : 'S${i + 1}';

      _drawStall(
        canvas: canvas,
        center: rectCenter,
        angle: angle + pi / 2,
        // para que el rect “mire” al centro
        size: stallSize,
        label: label,
        state: isSelected
            ? _StallState.selected
            : (isOccupied ? _StallState.occupied : _StallState.empty),
      );
    }
  }

  void _drawCenterCircle(Canvas canvas, Offset center, double r) {
    final paint = Paint()
      ..color = theme.colorScheme.primary.withOpacity(0.05)
      ..style = PaintingStyle.fill;

    canvas.drawCircle(center, r, paint);

    final border = Paint()
      ..color = theme.colorScheme.primary.withOpacity(0.1)
      ..style = PaintingStyle.stroke;

    canvas.drawCircle(center, r, border);

    final tp = _textPainter(
      centerLabel,
      style: theme.textTheme.bodyMedium?.copyWith(
        color: theme.colorScheme.onSurface.withOpacity(0.5),
      ),
    );
    tp.layout();
    tp.paint(canvas, center - Offset(tp.width / 2, tp.height / 2));
  }

  void _drawStall({
    required Canvas canvas,
    required Offset center,
    required double angle,
    required Size size,
    required String label,
    required _StallState state,
  }) {
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(angle);

    final rect = RRect.fromRectAndRadius(
      Rect.fromCenter(
        center: Offset.zero,
        width: size.width,
        height: size.height,
      ),
      const Radius.circular(8),
    );

    switch (state) {
      case _StallState.empty:
        // fondo claro
        final bg = Paint()
          ..color = theme.colorScheme.onSurface.withOpacity(0.02)
          ..style = PaintingStyle.fill;
        canvas.drawRRect(rect, bg);

        // borde punteado
        final border = Paint()
          ..color = theme.colorScheme.onSurface.withOpacity(0.25)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2;
        _drawDashedRRect(canvas, rect, border, dash: 6, gap: 5);

        // etiqueta
        final tp = _textPainter(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.45),
          ),
        );
        tp.layout(maxWidth: size.width - 8);
        tp.paint(canvas, Offset(-tp.width / 2, -tp.height / 2));
        break;

      case _StallState.occupied:
      case _StallState.selected:
        final fill = Paint()
          ..color =
              (state == _StallState.selected
                      ? theme.colorScheme.primary
                      : const Color(0xFF3E5F46)) // verde similar al mock
                  .withOpacity(0.95)
          ..style = PaintingStyle.fill;
        canvas.drawRRect(rect, fill);

        final tp = _textPainter(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        );
        tp.layout(maxWidth: size.width - 10);
        tp.paint(canvas, Offset(-tp.width / 2, -tp.height / 2));
        break;
    }

    canvas.restore();
  }

  void _drawDashedRRect(
    Canvas canvas,
    RRect rrect,
    Paint paint, {
    double dash = 6,
    double gap = 4,
  }) {
    final path = Path()..addRRect(rrect);
    final metrics = path.computeMetrics();
    for (final metric in metrics) {
      double dist = 0;
      while (dist < metric.length) {
        final len = min(dash, metric.length - dist);
        final extract = metric.extractPath(dist, dist + len);
        canvas.drawPath(extract, paint);
        dist += dash + gap;
      }
    }
  }

  TextPainter _textPainter(String text, {TextStyle? style}) {
    return TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
      maxLines: 1,
      ellipsis: '…',
    );
  }

  @override
  bool shouldRepaint(covariant _StablePainter oldDelegate) {
    return stallCount != oldDelegate.stallCount ||
        centerLabel != oldDelegate.centerLabel ||
        selectedIndex != oldDelegate.selectedIndex ||
        occupied != oldDelegate.occupied;
  }
}

enum _StallState { empty, occupied, selected }
