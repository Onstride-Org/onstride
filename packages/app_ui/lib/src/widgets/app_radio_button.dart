// ignore_for_file: public_member_api_docs

import 'package:flutter/material.dart';

class AppRadioButton extends StatelessWidget {
  const AppRadioButton({
    super.key,
    required this.isSelected,
    required this.onTap,
  });
  final bool isSelected;
  final void Function() onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        height: 24,
        width: 24,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Theme.of(context).colorScheme.secondary,
          border: Border.all(
            color: Theme.of(context).colorScheme.primary,
            width: 2,
          ),
        ),
        child: isSelected
            ? Padding(
                padding: const EdgeInsets.all(2),
                child: Container(
                  height: 20,
                  width: 20,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              )
            : const SizedBox.shrink(),
      ),
    );
  }
}
