import 'package:app_ui/app_ui.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// A custom multiselect dropdown widget with an inline overlay menu (no modal).
///
/// - Styled to match GLDropdown (borders, typography, spacing).
/// - Uses an OverlayEntry so it can appear above dialogs/bottom sheets.
class GLMultiselectDropdown<T extends Object?> extends StatefulWidget {
  const GLMultiselectDropdown({
    super.key,
    required this.items,
    required this.selectedItems,
    required this.onChanged,
    required this.itemBuilder,
    required this.selectedItemBuilder,
    required this.hintLabel,
    this.label,
    this.enabled = true,
    this.buttonPadding,
    this.hasBorder = true,
    this.suffix,
    this.maxOverlayHeight = 300,
  });

  final List<T> items;
  final List<T> selectedItems;

  final void Function(List<T> selectedItems) onChanged;

  /// Renders each row item inside the overlay.
  final Widget Function(T item) itemBuilder;

  /// Renders each selected item chip/text inside the button.
  final Widget Function(T item) selectedItemBuilder;

  final String hintLabel;
  final Widget? label;

  final bool enabled;
  final EdgeInsetsGeometry? buttonPadding;
  final bool hasBorder;
  final Widget? suffix;

  final double maxOverlayHeight;

  @override
  State<GLMultiselectDropdown<T>> createState() =>
      _GLMultiselectDropdownState<T>();
}

class _GLMultiselectDropdownState<T> extends State<GLMultiselectDropdown<T>>
    with SingleTickerProviderStateMixin {
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _overlayEntry;

  late List<T> _selectedInternal;

  late final AnimationController _animationController;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _selectedInternal = List<T>.from(widget.selectedItems);

    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, -0.05), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _animationController,
            curve: Curves.easeInOut,
          ),
        );
  }

  @override
  void didUpdateWidget(covariant GLMultiselectDropdown<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!listEquals(oldWidget.selectedItems, widget.selectedItems)) {
      _selectedInternal = List<T>.from(widget.selectedItems);
    }

    // If items list changed while overlay is open, rebuild it.
    if (_overlayEntry != null && !listEquals(oldWidget.items, widget.items)) {
      _rebuildOverlay();
    }
  }

  @override
  void dispose() {
    _closeDropdown(immediate: true);
    _animationController.dispose();
    super.dispose();
  }

  void _toggleDropdown() {
    if (!widget.enabled) return;

    if (_overlayEntry == null) {
      _overlayEntry = _createOverlayEntry();
      Overlay.of(context).insert(_overlayEntry!);
      _animationController.forward();
    } else {
      _closeDropdown();
    }
  }

  void _closeDropdown({bool immediate = false}) {
    if (_overlayEntry == null) return;

    if (immediate) {
      _overlayEntry?.remove();
      _overlayEntry = null;
      return;
    }

    _animationController.reverse().then((_) {
      _overlayEntry?.remove();
      _overlayEntry = null;
    });
  }

  void _rebuildOverlay() {
    if (_overlayEntry == null) return;

    _overlayEntry?.remove();
    _overlayEntry = _createOverlayEntry();
    Overlay.of(context).insert(_overlayEntry!);
    _animationController.forward(from: 0);
  }

  void _onItemChanged(T item, bool shouldSelect) {
    setState(() {
      if (shouldSelect) {
        if (!_selectedInternal.contains(item)) {
          _selectedInternal.add(item);
        }
      } else {
        _selectedInternal.remove(item);
      }
    });

    widget.onChanged(List<T>.from(_selectedInternal));

    _overlayEntry?.markNeedsBuild();
  }

  OverlayEntry _createOverlayEntry() {
    final renderBox = context.findRenderObject()! as RenderBox;
    final size = renderBox.size;
    final offset = renderBox.localToGlobal(Offset.zero);

    final overlayDecoration = BoxDecoration(
      color: Colors.white,
      borderRadius: 8.borderRadiusA,
      boxShadow: [
        BoxShadow(
          color: context.shadowColor,
          blurRadius: 8,
          offset: const Offset(0, 4),
        ),
      ],
    );

    return OverlayEntry(
      builder: (context) => Stack(
        children: [
          Positioned.fill(
            child: GestureDetector(
              onTap: _closeDropdown,
              behavior: HitTestBehavior.translucent,
              child: const SizedBox.expand(),
            ),
          ),
          Positioned(
            left: offset.dx,
            top: offset.dy + size.height,
            width: size.width,
            child: CompositedTransformFollower(
              link: _layerLink,
              showWhenUnlinked: false,
              offset: Offset(0, size.height),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: Material(
                    color: Colors.transparent,
                    child: DecoratedBox(
                      decoration: overlayDecoration,
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          maxHeight: widget.maxOverlayHeight,
                        ),
                        child: ListView.separated(
                          padding: 8.edgeInsetsV,
                          shrinkWrap: true,
                          itemCount: widget.items.length,
                          separatorBuilder: (_, __) =>
                              Divider(height: 1, color: Colors.grey.shade200),
                          itemBuilder: (context, index) {
                            final item = widget.items[index];
                            final isSelected = _selectedInternal.contains(item);

                            return InkWell(
                              onTap: () => _onItemChanged(item, !isSelected),
                              child: Padding(
                                padding: [4, 2].edgeInsetsHV,
                                child: Row(
                                  children: [
                                    Checkbox(
                                      value: isSelected,
                                      onChanged: (_) =>
                                          _onItemChanged(item, !isSelected),
                                      side: const BorderSide(
                                        color: GLColors.neutral400,
                                      ),
                                    ),
                                    Expanded(
                                      child: DefaultTextStyle(
                                        style: context.bodyMedium.copyWith(
                                          color: GLColors.neutral400,
                                        ),
                                        child: widget.itemBuilder(item),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final enabled = widget.enabled;
    final enableColor = enabled ? context.hintColor : context.disableColor;

    final suffixIcon =
        widget.suffix ?? Icon(Icons.expand_more, color: enableColor);

    final buttonContent = _selectedInternal.isEmpty
        ? Text(
            widget.hintLabel,
            style: context.labelLarge.copyWith(color: enableColor),
            overflow: TextOverflow.ellipsis,
          )
        : Wrap(
            spacing: 10,
            runSpacing: 8,
            children: _selectedInternal
                .map(
                  (item) => DecoratedBox(
                    decoration: BoxDecoration(
                      color: GLColors.brand50,
                      borderRadius: 8.borderRadiusA,
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      child: DefaultTextStyle(
                        style: context.bodyMedium,
                        child: widget.selectedItemBuilder(item),
                      ),
                    ),
                  ),
                )
                .toList(),
          );

    final dropdownButton = IgnorePointer(
      ignoring: !enabled,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _toggleDropdown,
        child: CompositedTransformTarget(
          link: _layerLink,
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.all(Radius.circular(8)),
              border: widget.hasBorder ? Border.all(color: enableColor) : null,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 48),
              child: Padding(
                // ✅ Default padding similar to inputs / GLDropdown look & feel
                padding:
                    widget.buttonPadding ??
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(child: buttonContent),
                    suffixIcon,
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );

    if (widget.label != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          DefaultTextStyle(
            style: context.bodyMedium.copyWith(fontWeight: FontWeight.w400),
            child: widget.label!,
          ),
          GLSpaces.px8,
          dropdownButton,
        ],
      );
    }

    return dropdownButton;
  }
}
