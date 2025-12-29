import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/core/common/dialogs/calendar_datetime_picker.dart';

class DueDateTimeField extends StatefulWidget {
  const DueDateTimeField({
    required this.label,
    required this.hint,
    required this.controller,
    required this.monthNames,
    required this.years,
    required this.focused,
    required this.selected,
    required this.onPicked,
    this.isError = false,
    this.errorText,
    this.validationError = false,
  });

  final String label;
  final String hint;
  final TextEditingController controller;
  final List<String> monthNames;
  final List<int> years;
  final DateTime focused;
  final DateTime selected;
  final void Function(DateTime selected, DateTime focused) onPicked;
  final bool isError;
  final String? errorText;
  final bool validationError;

  @override
  State<DueDateTimeField> createState() => _DueDateTimeFieldState();
}

class _DueDateTimeFieldState extends State<DueDateTimeField> {
  late final DateTime _tempFocused = widget.focused;
  late final DateTime _tempSelected = widget.selected;

  Future<void> _openPicker() async {
    final picked = await GLCalendarDateTimePicker.show(
      context,
      maxDate: DateTime(3000),
      minDate: DateTime.now(),
      initialDate: _tempSelected,
      monthNames: widget.monthNames,
      years: widget.years,
    );

    if (picked != null) {
      widget.onPicked(picked, _tempFocused);
    }
  }

  @override
  Widget build(BuildContext context) {
    final borderColor = (widget.isError || widget.validationError)
        ? Colors.red
        : GLColors.neutral1000;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: Theme.of(context).textTheme.bodyMedium),
        GLSpaces.px8,
        TextFormField(
          controller: widget.controller,
          readOnly: true,
          style: context.bodyMedium,
          decoration: InputDecoration(
            hintText: widget.hint,
            contentPadding: const EdgeInsets.symmetric(
              vertical: 14,
              horizontal: 12,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: borderColor, width: 2),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: borderColor),
            ),
            suffixIcon: Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Assets.images.iconCalendar.image(),
            ),
            suffixIconConstraints: const BoxConstraints(maxHeight: 24),
          ),
          onTap: _openPicker,
        ),
        if (widget.isError) ...[
          GLSpaces.px8,
          Text(
            widget.errorText ?? '',
            style: context.bodySmall.copyWith(color: Colors.red),
          ),
        ],
      ],
    );
  }
}
