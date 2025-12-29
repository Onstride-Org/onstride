import 'package:app_ui/app_ui.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class BoarderSelector extends ConsumerWidget {
  const BoarderSelector({
    required this.onChanged,
    this.boarder,
    super.key,
  });

  final ValueChanged<GLUser> onChanged;
  final GLUser? boarder;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final users = ref.watch(fetchUsersProvider).boarders;
    return GLDropdown<GLUser>(
      items: users,
      onChanged: onChanged,
      selectedValue: boarder,
      itemBuilder: (item) {
        return Text(item.name ?? '');
      },
      hintLabel: users.isEmpty
          ? context.l10n.youStillDonTHaveBoarders
          : context.l10n.selectBoarder,
      selectedItemBuilder: (selected) => Text(selected.name ?? ''),
    );
  }
}
