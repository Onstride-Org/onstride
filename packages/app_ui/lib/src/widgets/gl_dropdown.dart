import 'package:app_ui/app_ui.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:flutter/material.dart';

/// A custom dropdown widget that displays a list of items in a modal sheet.
///
/// This widget creates a dropdown-like interface that
/// when tapped, opens a modal
/// sheet containing a list of selectable options.
class GLDropdown<T extends Object?> extends StatefulWidget {
  const GLDropdown({
    super.key,
    required this.items,
    required this.onChanged,
    required this.selectedValue,
    required this.itemBuilder,
    this.label,
    required this.hintLabel,
    this.enabled = true,
    required this.selectedItemBuilder,
    this.buttonPadding,
    this.hasBorder = true,
    this.suffix,
  });

  final List<T>? items;
  final T? selectedValue;
  final void Function(T value) onChanged;
  final String hintLabel;

  final Widget Function(T item) itemBuilder;
  final Widget Function(T item) selectedItemBuilder;

  final Widget? label;
  final bool enabled;
  final EdgeInsetsGeometry? buttonPadding;
  final bool hasBorder;
  final Widget? suffix;

  @override
  State<GLDropdown<T>> createState() => _GLDropdownNewState<T>();
}

class _GLDropdownNewState<T> extends State<GLDropdown<T>> {
  @override
  Widget build(BuildContext context) {
    final items = widget.items ?? <T>[];
    final selectedValue = widget.selectedValue;

    int? selectedIndex;
    if (selectedValue != null) {
      final index = items.indexOf(selectedValue);
      if (index != -1) {
        selectedIndex = index;
      }
    }

    final dropdownItems = List<DropdownMenuItem<int>>.generate(
      items.length,
      (i) => DropdownMenuItem<int>(
        value: i,
        child: DefaultTextStyle(
          style: context.bodyMedium.copyWith(color: GLColors.neutral400),
          child: widget.itemBuilder(items[i]),
        ),
      ),
    );

    final enabled = widget.enabled;
    final enableColor = enabled ? context.hintColor : context.disableColor;
    final selectedItemBuilder = widget.selectedItemBuilder;

    final dropdown = IgnorePointer(
      ignoring: !enabled,
      child: DropdownButton2<int>(
        selectedItemBuilder: selectedValue != null
            ? (context) => List.generate(
                dropdownItems.length,
                (_) => DefaultTextStyle(
                  style: context.bodyMedium,
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: selectedItemBuilder(selectedValue),
                  ),
                ),
              )
            : null,
        buttonStyleData: ButtonStyleData(
          padding: widget.buttonPadding ?? 12.edgeInsetsR,
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.all(Radius.circular(8)),
            border: widget.hasBorder ? Border.all(color: enableColor) : null,
          ),
          elevation: 0,
        ),
        hint: Text(
          widget.hintLabel,
          style: context.labelLarge.copyWith(color: enableColor),
        ),
        dropdownStyleData: DropdownStyleData(
          maxHeight: 300,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: 8.borderRadiusA,
            boxShadow: [
              BoxShadow(
                color: context.shadowColor,
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
        ),
        menuItemStyleData: MenuItemStyleData(
          selectedMenuItemBuilder: (context, child) => Padding(
            padding: [4, 2].edgeInsetsHV,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: 8.borderRadiusA,
                color: GLColors.brand50,
              ),
              child: child,
            ),
          ),
        ),
        value: selectedIndex,
        items: dropdownItems,
        underline: const SizedBox.shrink(),
        iconStyleData: IconStyleData(
          icon: widget.suffix ?? Icon(Icons.expand_more, color: enableColor),
        ),
        isExpanded: true,
        onChanged: (index) {
          if (index == null) return;
          widget.onChanged(items[index]);
        },
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
          dropdown,
        ],
      );
    } else {
      return dropdown;
    }
  }
}
