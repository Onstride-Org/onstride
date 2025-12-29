import 'package:app_ui/app_ui.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class HorseStatusSelector extends ConsumerWidget {
  const HorseStatusSelector({
    required this.onChanged,
    this.status,
    super.key,
  });

  final ValueChanged<HorseStatus> onChanged;
  final HorseStatus? status;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const statuses = HorseStatus.values;

    final locale = context.l10n;
    return GLDropdown<HorseStatus>(
      items: statuses,
      onChanged: onChanged,
      selectedValue: status,
      itemBuilder: (item) {
        return Text(item.label(locale));
      },
      hintLabel: 'Select status',
      selectedItemBuilder: (selected) => Text(selected.label(locale)),
    );
  }
}
