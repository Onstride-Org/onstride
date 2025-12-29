import 'package:app_ui/app_ui.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/horses/providers/load_horses_options/load_horses_options_provider.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class SexStatusSelector extends ConsumerWidget {
  const SexStatusSelector({
    required this.onChanged,
    this.sexStatus,
    super.key,
  });

  final ValueChanged<HorseSexStatus> onChanged;
  final HorseSexStatus? sexStatus;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final breeds = ref.read(loadHorsesOptionsProvider).sexStatus;

    final locale = context.l10n.locale;
    return GLDropdown<HorseSexStatus>(
      items: breeds,
      onChanged: onChanged,
      selectedValue: sexStatus,
      itemBuilder: (item) {
        return Text(item.label(locale));
      },
      hintLabel: context.l10n.selectOption,
      selectedItemBuilder: (selected) => Text(selected.label(locale)),
    );
  }
}
