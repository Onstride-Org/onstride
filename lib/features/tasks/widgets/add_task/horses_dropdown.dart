import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/horses/providers/fetch_horses/fetch_horses_provider.dart';
import 'package:models/models.dart';

class HorsesDropdown extends ConsumerWidget {
  const HorsesDropdown({
    required this.label,
    required this.hint,
    required this.selected,
    required this.onChanged,
    this.validationError = false,
    super.key,
  });

  final String label;
  final String hint;

  /// Multi-selection
  final List<HorseModel> selected;
  final ValueChanged<List<HorseModel>> onChanged;

  final bool validationError;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(fetchHorsesProvider);
    final horses = state.horses;

    final borderColor = validationError ? Colors.red : null;

    final dropdown = GLMultiselectDropdown<HorseModel>(
      items: horses,
      selectedItems: selected,
      hintLabel: hint,
      onChanged: onChanged,
      hasBorder: borderColor == null,
      itemBuilder: (horse) {
        final isLast = horses.isNotEmpty && horse.id == horses.last.id;
        return Container(
          width: MediaQuery.of(context).size.width,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: const BoxDecoration(),
          child: Text(
            horse.name,
            overflow: TextOverflow.ellipsis,
          ),
        );
      },
      selectedItemBuilder: (horse) => Text(
        horse.name,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.bodyMedium,
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        GLSpaces.px8,
        if (borderColor != null)
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: borderColor),
            ),
            child: dropdown,
          )
        else
          dropdown,
      ],
    );
  }
}
