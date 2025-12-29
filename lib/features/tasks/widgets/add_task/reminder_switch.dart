import 'package:flutter/material.dart';

class ReminderSwitchRow extends StatelessWidget {
  const ReminderSwitchRow({
    required this.text,
    required this.value,
    required this.onChanged,
  });

  final String text;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(text, style: Theme.of(context).textTheme.bodyMedium),
        ),
        SizedBox(
          height: 30,
          child: FittedBox(
            fit: BoxFit.fitHeight,
            child: Switch(value: value, onChanged: onChanged),
          ),
        ),
      ],
    );
  }
}
