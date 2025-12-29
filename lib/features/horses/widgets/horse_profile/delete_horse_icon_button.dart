import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/horses/providers/load_horse_tasks/load_horse_tasks.dart';
import 'package:gl_horses/features/horses/providers/load_horse_tasks/load_horse_tasks_state.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class DeleteHorseIconButton extends ConsumerWidget {
  const DeleteHorseIconButton({
    required this.horse,
    super.key,
  });

  final HorseModel horse;

  void _deleteListener(
    BuildContext context,
    DeleteHorseState next,
    WidgetRef ref,
  ) {
    switch (next) {
      case InitialDeleteHorseState():
        return;
      case LoadingDeleteHorseState():
        return showInvisibleLoadingDialog(context);
      case SuccessDeleteHorseState():
        context.pop();
        context.showSuccess(title: context.l10n.horseDeletedSuccess);
        final stallId = next.horse.stallId;
        if (stallId != null) {
          ref.read(accountProvider.notifier).assignHorseToStall(stallId, null);
        }
        ref.read(fetchHorsesProvider.notifier).removeHorse(next.horse);
        return context.pop();
      case ErrorDeleteHorseState():
        context.pop();
        return context.showDataException(next.exception);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final pendingTasks = ref.watch(loadHorseTasksProvider).pendingTasks;
    final hasPendingTasks = pendingTasks.isNotEmpty;

    ref.listen(
      deleteHorseProvider,
      (_, next) => _deleteListener(context, next, ref),
    );

    return IconButton(
      onPressed: () async {
        final extraDescription = hasPendingTasks
            ? l10n.deleteHorsePendingExtra
            : '';
        final res = await ConfirmDialog.show(
          context,
          title: l10n.deleteHorseTitle,
          description:
              '${l10n.deleteHorseDescription(horse.name)}\n$extraDescription',
        );
        if (res != null && res) {
          final user = ref.read(accountProvider).currentUser;
          await ref
              .read(deleteHorseProvider.notifier)
              .deleteHorse(horse: horse, deletedBy: user.id);
        }
      },
      color: GLColors.error500,
      icon: const Icon(GLIcons.delete),
    );
  }
}
