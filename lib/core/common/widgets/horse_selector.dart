import 'package:app_ui/app_ui.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

export 'horse_selector.dart';

/// Dropdown for selecting a horse with optional filtering by boarder.
/// If [boarderId] is null/empty, the dropdown is disabled and shows a
/// "Select a boarder first" hint (unless [hintLabel] overrides it).
class HorseSelector extends ConsumerWidget {
  const HorseSelector({
    required this.onChanged,
    this.horse,
    this.boarderId,
    this.hintLabel,
    this.additionalFilter,
    super.key,
  });

  /// Callback when a horse is selected.
  final ValueChanged<HorseModel> onChanged;

  /// Currently selected horse (can be null).
  final HorseModel? horse;

  /// Filter horses by this boarderId. If null/empty, dropdown is disabled.
  final String? boarderId;

  /// Optional custom hint label. If null, a sensible default is chosen.
  final String? hintLabel;

  /// Optional extra predicate to filter horses (AND with boarder filter).
  final bool Function(HorseModel horse)? additionalFilter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(fetchHorsesProvider);
    final all = state.horses;

    final hasBoarder = boarderId != null && boarderId!.isNotEmpty;

    final filtered = hasBoarder
        ? all.where((h) {
            final byBoarder = h.boarderId == boarderId;
            final byCustom = additionalFilter?.call(h) ?? true;
            return byBoarder && byCustom;
          }).toList()
        : const <HorseModel>[];

    final resolvedHint =
        hintLabel ??
        (!hasBoarder
            ? context.l10n.selectBoarderFirst
            : (filtered.isEmpty
                  ? context.l10n.youStillDonTHaveHorses
                  : context.l10n.selectHorse));

    return GLDropdown<HorseModel>(
      items: filtered,
      onChanged: onChanged,
      selectedValue: hasBoarder ? horse : null,
      itemBuilder: (item) => Text(item.name),
      hintLabel: resolvedHint,
      selectedItemBuilder: (selected) => Text(selected.name),
    );
  }
}
