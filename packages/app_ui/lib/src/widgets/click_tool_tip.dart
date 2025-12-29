import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

class ClickTooltip extends StatefulWidget {
  const ClickTooltip({
    super.key,
    required this.message,
    required this.child,
    this.width = 200,
    this.showOffset = const Offset(0, 24),
    this.entryDuration = const Duration(milliseconds: 180),
    this.exitDuration = const Duration(milliseconds: 160),
    this.autoHide = const Duration(seconds: 3),
    this.showAbove = true, // NEW: controls placement
  });

  final String message;
  final Widget child;

  /// Tooltip box width
  final double width;

  /// Offset relative to the anchor
  final Offset showOffset;

  /// Fade/slide in duration
  final Duration entryDuration;

  /// Fade/slide out duration
  final Duration exitDuration;

  /// Time before auto-hide
  final Duration autoHide;

  /// NEW: if true, tooltip appears above the child; otherwise below.
  final bool showAbove;

  @override
  State<ClickTooltip> createState() => _ClickTooltipState();
}

class _ClickTooltipState extends State<ClickTooltip> {
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _overlayEntry;

  // Key to control overlay animations (dismiss with reverse)
  final GlobalKey<_AnimatedTooltipState> _overlayKey =
      GlobalKey<_AnimatedTooltipState>();

  void _toggleTooltip() {
    if (_overlayEntry != null) {
      _hideTooltip(); // reverse animation then remove
    } else {
      _showTooltip();
    }
  }

  void _showTooltip() {
    if (_overlayEntry != null) return;

    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        width: widget.width,
        child: _AnimatedTooltip(
          key: _overlayKey,
          message: widget.message,
          layerLink: _layerLink,
          offset: widget.showOffset,
          entryDuration: widget.entryDuration,
          exitDuration: widget.exitDuration,
          autoHide: widget.autoHide,
          showAbove: widget.showAbove,
          // NEW
          onDismissed: () {
            // Called after reverse animation completes
            _overlayEntry?.remove();
            _overlayEntry = null;
          },
        ),
      ),
    );

    final overlay = Overlay.of(context);
    if (overlay.mounted) {
      overlay.insert(_overlayEntry!);
    }
  }

  void _hideTooltip() {
    // Trigger reverse animation; overlay removes itself on completed
    _overlayKey.currentState?.dismiss();
  }

  @override
  void dispose() {
    // Ensure overlay is cleaned up
    _overlayKey.currentState?.disposeController();
    _overlayEntry?.remove();
    _overlayEntry = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CompositedTransformTarget(
      link: _layerLink,
      child: GestureDetector(
        onTap: _toggleTooltip,
        behavior: HitTestBehavior.translucent,
        child: widget.child,
      ),
    );
  }
}

/// Animated overlay content with fade + slide transitions.
/// Handles auto-hide and calls [onDismissed] after exit animation completes.
class _AnimatedTooltip extends StatefulWidget {
  const _AnimatedTooltip({
    super.key,
    required this.message,
    required this.layerLink,
    required this.offset,
    required this.entryDuration,
    required this.exitDuration,
    required this.autoHide,
    required this.onDismissed,
    required this.showAbove, // NEW
  });

  final String message;
  final LayerLink layerLink;
  final Offset offset;
  final Duration entryDuration;
  final Duration exitDuration;
  final Duration autoHide;
  final VoidCallback onDismissed;

  /// NEW: if true, position above; otherwise below.
  final bool showAbove;

  @override
  State<_AnimatedTooltip> createState() => _AnimatedTooltipState();
}

class _AnimatedTooltipState extends State<_AnimatedTooltip>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;
  bool _isDismissing = false;

  @override
  void initState() {
    super.initState();

    // Animations setup
    _controller = AnimationController(
      vsync: this,
      duration: widget.entryDuration,
      reverseDuration: widget.exitDuration,
    );

    final curveIn = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    );
    final curveOut = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
      reverseCurve: Curves.easeInCubic,
    );

    _fade = Tween<double>(begin: 0, end: 1).animate(curveOut);

    // Slide from slightly below if showing below; slightly above if showing above.
    _slide = Tween<Offset>(
      begin: widget.showAbove ? const Offset(0, -0.08) : const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(curveIn);

    // Play enter animation
    _controller.forward();

    // Auto-hide after given duration
    Future.delayed(widget.autoHide, () {
      if (mounted && !_isDismissing) {
        dismiss();
      }
    });

    // Notify when fully dismissed
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.dismissed && _isDismissing) {
        widget.onDismissed();
      }
    });
  }

  /// Public dismiss to trigger reverse animation
  void dismiss() {
    if (_isDismissing) return;
    _isDismissing = true;
    _controller.reverse();
  }

  /// Allow parent to safely dispose controller on widget disposal
  void disposeController() {
    if (mounted) {
      _controller.stop();
    }
    _controller.dispose();
  }

  @override
  void dispose() {
    disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // When showing above, flip anchors so the follower sticks under its bottom.
    final targetAnchor = widget.showAbove
        ? Alignment.topCenter
        : Alignment.bottomCenter;
    final followerAnchor = widget.showAbove
        ? Alignment.bottomCenter
        : Alignment.topCenter;

    // Keep the same horizontal offset; flip vertical sign when above.
    final effectiveOffset = widget.showAbove
        ? Offset(widget.offset.dx, -widget.offset.dy)
        : widget.offset;

    return CompositedTransformFollower(
      link: widget.layerLink,
      showWhenUnlinked: false,
      targetAnchor: targetAnchor,
      followerAnchor: followerAnchor,
      offset: effectiveOffset,
      child: FadeTransition(
        opacity: _fade,
        child: SlideTransition(
          position: _slide,
          child: Material(
            elevation: 4,
            borderRadius: 8.borderRadiusA,
            color: Colors.white,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: 8.borderRadiusA,
                border: Border.all(color: GLColors.neutral1100),
              ),
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Text(
                  widget.message,
                  style: GLTextStyles.labelMedium.copyWith(
                    color: GLColors.neutral700,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
