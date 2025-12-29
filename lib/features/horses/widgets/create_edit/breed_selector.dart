import 'package:app_ui/app_ui.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/horses/providers/load_horses_options/load_horses_options_provider.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class BreedSelector extends ConsumerWidget {
  const BreedSelector({
    required this.onChanged,
    this.breed,
    super.key,
  });

  final ValueChanged<HorseBreed> onChanged;
  final HorseBreed? breed;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final breeds = ref.watch(loadHorsesOptionsProvider).breeds;
    final locale = context.l10n.locale;
    return GLDropdown<HorseBreed>(
      items: [...breeds, if (breed != null && !breeds.contains(breed)) breed!],
      onChanged: onChanged,
      selectedValue: breed,
      itemBuilder: (item) {
        return Text(item.label(locale));
      },
      hintLabel: context.l10n.selectOption,
      selectedItemBuilder: (selected) => Text(selected.label(locale)),
    );
  }
}
