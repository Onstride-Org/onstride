import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/l10n/l10n.dart';

class TaskNameField extends StatelessWidget {
  const TaskNameField({
    required this.label,
    required this.hint,
    required this.controller,
    this.onChanged,
    this.duplicateError = false,
    this.validationError = false,
  });

  final String label;
  final String hint;
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final bool duplicateError;
  final bool validationError;

  bool _isOnlyDigits(String s) =>
      RegExp(r'^\d+$').hasMatch(s.replaceAll(' ', ''));

  bool _hasInvalidChars(String s) => !RegExp(r'^[A-Za-zÀ-ÿ0-9 ]+$').hasMatch(s);

  @override
  Widget build(BuildContext context) {
    final text = controller.text.trim();
    final formatError =
        text.isNotEmpty && (_isOnlyDigits(text) || _hasInvalidChars(text));

    final isError = duplicateError || formatError || validationError;
    final borderColor = isError ? Colors.red : GLColors.neutral1000;

    String? errorText;
    if (duplicateError) {
      errorText = context.l10n.taskAlreadyExistsErrorMsg;
    } else if (formatError) {
      errorText = _isOnlyDigits(text)
          ? context.l10n.taskNameOnlyNumbersErrorMsg
          : context.l10n.taskNameSpecialCharactersErrorMsg;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        GLSpaces.px8,
        TextField(
          controller: controller,
          onChanged: onChanged,
          textCapitalization: TextCapitalization.sentences,
          style: context.bodyMedium,
          maxLength: 50,
          decoration: InputDecoration(
            hintText: hint,
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
            errorText: isError ? errorText : null,
          ),
        ),
      ],
    );
  }
}
