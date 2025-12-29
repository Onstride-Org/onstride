import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

/// {@template bouncing_dots_indicator}
/// A custom loading indicator made of three bouncing dots.
///
/// Each dot moves up and down in a smooth loop with a slight delay between them,
/// creating a continuous bouncing effect.
///
/// You can customize the [color], [size], [duration], [spacing],
/// and [bounceHeight] of the animation.
///
/// Example:
/// ```dart
/// const GLBouncingDotsIndicator(
///   color: Colors.blue,
///   size: 10,
///   spacing: 6,
///   bounceHeight: 12,
/// )
/// ```
/// {@endtemplate}
class GLBouncingDotsIndicator extends StatefulWidget {
  /// {@macro bouncing_dots_indicator}
  const GLBouncingDotsIndicator({
    super.key,
    this.color = GLColors.brand500,
    this.size = 12.0,
    this.duration = const Duration(milliseconds: 800),
    this.spacing = 8.0,
    this.bounceHeight = 6.0,
  });

  /// The color of the bouncing dots.
  final Color color;

  /// The diameter of each dot.
  final double size;

  /// Total duration for a full bounce animation cycle.
  final Duration duration;

  /// Spacing between dots.
  final double spacing;

  /// Maximum vertical movement of each dot (in pixels).
  final double bounceHeight;

  @override
  State<GLBouncingDotsIndicator> createState() =>
      _GLBouncingDotsIndicatorState();
}

class _GLBouncingDotsIndicatorState extends State<GLBouncingDotsIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final List<Animation<double>> _animations;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(vsync: this, duration: widget.duration)
      ..repeat();

    _animations = List.generate(3, (index) {
      final start = index * 0.15;
      final end = start + 0.7;

      return TweenSequence([
        TweenSequenceItem(
          tween: Tween<double>(
            begin: 0,
            end: -widget.bounceHeight,
          ).chain(CurveTween(curve: Curves.easeOut)),
          weight: 50,
        ),
        TweenSequenceItem(
          tween: Tween<double>(
            begin: -widget.bounceHeight,
            end: 0,
          ).chain(CurveTween(curve: Curves.easeIn)),
          weight: 50,
        ),
      ]).animate(
        CurvedAnimation(
          parent: _controller,
          curve: Interval(start, end, curve: Curves.easeInQuad),
        ),
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Builds a single animated dot with a vertical bounce effect.
  Widget _buildDot(int index) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (_, __) {
        return Transform.translate(
          offset: Offset(0, _animations[index].value),
          child: Container(
            width: widget.size,
            height: widget.size,
            margin: EdgeInsets.symmetric(horizontal: widget.spacing / 2),
            decoration: BoxDecoration(
              color: widget.color,
              shape: BoxShape.circle,
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: widget.bounceHeight.edgeInsetsV,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(3, _buildDot),
      ),
    );
  }
}
