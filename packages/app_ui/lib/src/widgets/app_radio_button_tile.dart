// ignore_for_file: public_member_api_docs

import 'package:app_ui/src/widgets/app_radio_button.dart';
import 'package:flutter/material.dart';

class AppRadioButtonTile extends StatefulWidget {
  const AppRadioButtonTile({
    super.key,
    required this.item,
    required this.onChanged,
    this.fontSize,
    this.fontColor,
    this.color,
    required this.selectedItem,
  });
  final dynamic item;
  final dynamic selectedItem;
  final void Function(dynamic) onChanged;
  final double? fontSize;
  final Color? color;
  final Color? fontColor;

  @override
  State<AppRadioButtonTile> createState() => _AppRadioButtonState();
}

class _AppRadioButtonState extends State<AppRadioButtonTile> {
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => widget.onChanged(widget.item),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
        decoration: BoxDecoration(
          color: widget.color ?? Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Row(
          children: [
            AppRadioButton(
              isSelected: widget.selectedItem == widget.item,
              onTap: () => widget.onChanged(
                widget.item,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              widget.item.toString(),
              style: (widget.item == widget.selectedItem
                      ? Theme.of(context)
                          .textTheme
                          .bodyMedium!
                          .copyWith(fontWeight: FontWeight.w700)
                      : Theme.of(context).textTheme.bodyMedium)!
                  .copyWith(
                color:
                    widget.fontColor ?? Theme.of(context).colorScheme.primary,
                fontSize: widget.fontSize,
                height: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
