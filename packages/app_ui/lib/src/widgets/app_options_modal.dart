// ignore_for_file: public_member_api_docs

import 'package:app_ui/src/widgets/widgets.dart';
import 'package:flutter/material.dart';

class AppDropdownModal extends StatefulWidget {
  const AppDropdownModal({
    super.key,
    required this.items,
    required this.onChanged,
    required this.nullable,
    required this.selectedValue,
  });
  final List<dynamic> items;
  final dynamic selectedValue;
  final void Function(dynamic) onChanged;
  final bool nullable;

  @override
  State<AppDropdownModal> createState() => _DropdownModalState();
}

class _DropdownModalState extends State<AppDropdownModal> {
  dynamic selectedValue;

  @override
  void initState() {
    selectedValue = widget.selectedValue;
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 32),
        Container(height: 1, color: Theme.of(context).colorScheme.surface),
        for (final item in widget.items) ...[
          InkWell(
            onTap: () {
              widget.onChanged(item);
              setState(() {
                selectedValue = item;
              });
              Navigator.pop(context);
            },
            child: Column(
              children: [
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (item == null)
                      Row(
                        children: [
                          Text(
                            'None',
                            style: Theme.of(context).textTheme.headlineMedium,
                          )
                        ],
                      )
                    else
                      Row(
                        children: [
                          Text(
                            item.toString(),
                            style: Theme.of(context).textTheme.headlineSmall,
                          )
                        ],
                      ),
                    AppRadioButton(
                      isSelected: selectedValue == item,
                      onTap: () {
                        widget.onChanged(item);
                        setState(() {
                          selectedValue = item;
                        });
                      },
                    )
                  ],
                ),
                const SizedBox(height: 24)
              ],
            ),
          ),
          Container(height: 1, color: Theme.of(context).colorScheme.primary),
        ],
        if (widget.nullable) _noneOption(),
        const SizedBox(height: 48),
      ],
    );
  }

  Widget _noneOption() {
    return InkWell(
      onTap: () {
        widget.onChanged(null);
        setState(() {
          selectedValue = null;
        });
        Navigator.pop(context);
      },
      child: Column(
        children: [
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    'None',
                    style: Theme.of(context).textTheme.headlineMedium,
                  )
                ],
              ),
              AppRadioButton(
                isSelected: selectedValue == null,
                onTap: () {
                  widget.onChanged(null);
                  setState(() {
                    selectedValue = null;
                  });
                },
              )
            ],
          ),
          const SizedBox(height: 24)
        ],
      ),
    );
  }
}
