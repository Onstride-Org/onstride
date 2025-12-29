import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

class DashedBorderContainer extends StatelessWidget {
  const DashedBorderContainer({
    required this.width,
    required this.height,
    required this.color,
    required this.radius,
    required this.child,
    super.key,
    this.strokeWidth = 1.0,
    this.dashLength = 6.0,
    this.dashGap = 4.0,
  });

  final double width;
  final double height;
  final double radius;
  final double strokeWidth;
  final double dashLength;
  final double dashGap;
  final Color color;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: DashedRRectPainter(
        color: color,
        radius: radius,
        strokeWidth: strokeWidth,
        dashLength: dashLength,
        dashGap: dashGap,
        background: context.backgroundColor,
      ),
      child: SizedBox(width: width, height: height, child: child),
    );
  }
}

class DashedRRectPainter extends CustomPainter {
  DashedRRectPainter({
    required this.color,
    required this.radius,
    required this.strokeWidth,
    required this.dashLength,
    required this.dashGap,
    required this.background,
  });

  final Color color;
  final double radius;
  final double strokeWidth;
  final double dashLength;
  final double dashGap;
  final Color background;

  @override
  void paint(Canvas canvas, Size size) {
    // Fill background to match other tiles
    final bgPaint = Paint()..color = background;
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(radius),
    );
    canvas.drawRRect(rrect, bgPaint);

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final path = Path()..addRRect(rrect);
    final dashed = _dashPath(path, dashLength, dashGap);
    canvas.drawPath(dashed, paint);
  }

  Path _dashPath(Path source, double dashLen, double dashGap) {
    final dest = Path();
    for (final metric in source.computeMetrics()) {
      double distance = 0.0;
      final total = metric.length;
      while (distance < total) {
        final next = distance + dashLen;
        dest.addPath(
          metric.extractPath(distance, next.clamp(0, total)),
          Offset.zero,
        );
        distance = next + dashGap;
      }
    }
    return dest;
  }

  @override
  bool shouldRepaint(covariant DashedRRectPainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.radius != radius ||
        oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.dashLength != dashLength ||
        oldDelegate.dashGap != dashGap ||
        oldDelegate.background != background;
  }
}
