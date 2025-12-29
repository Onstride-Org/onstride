import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

/// Widget displaying quick action buttons based on user role.
class QuickActionsWidget extends ConsumerWidget {
  const QuickActionsWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(accountProvider).currentUser;
    final actions = _getActionsForUser(context, user);

    if (actions.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: SizedBox(
        height: 90,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 4),
          itemCount: actions.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (context, index) {
            final action = actions[index];
            return _QuickActionButton(action: action);
          },
        ),
      ),
    );
  }

  List<_QuickAction> _getActionsForUser(BuildContext context, GLUser user) {
    final actions = <_QuickAction>[];

    // Common actions for all users
    if (!user.isBoarder) {
      actions.add(
        _QuickAction(
          icon: GLIcons.taskoutline,
          label: context.l10n.addTask,
          color: Colors.blue,
          action: QuickActionType.addTask,
        ),
      );
    }

    // Owner/Admin actions
    if (user.isOwner || user.canManageHorses) {
      actions.add(
        _QuickAction(
          icon: GLIcons.horse,
          label: context.l10n.addHorse,
          color: Colors.green,
          action: QuickActionType.addHorse,
        ),
      );
    }

    // Ride log action for anyone who can log rides
    if (user.isOwner || user.canManageHorses || user.isBoarder) {
      actions.add(
        _QuickAction(
          icon: Icons.directions_run,
          label: context.l10n.logRide,
          color: Colors.orange,
          action: QuickActionType.logRide,
        ),
      );
    }

    // Invoice action for billing users
    if (user.canGenerateInvoices) {
      actions.add(
        _QuickAction(
          icon: GLIcons.invoice,
          label: context.l10n.createInvoice,
          color: Colors.purple,
          action: QuickActionType.createInvoice,
        ),
      );
    }

    return actions;
  }
}

enum QuickActionType {
  addTask,
  addHorse,
  logRide,
  createInvoice,
}

class _QuickAction {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.action,
  });

  final IconData icon;
  final String label;
  final Color color;
  final QuickActionType action;
}

class _QuickActionButton extends ConsumerWidget {
  const _QuickActionButton({required this.action});

  final _QuickAction action;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _handleAction(context, ref),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: 80,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: action.color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: action.color.withValues(alpha: 0.2),
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: action.color.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  action.icon,
                  color: action.color,
                  size: 20,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                action.label,
                style: TextStyle(
                  color: action.color.withValues(alpha: 0.9),
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleAction(BuildContext context, WidgetRef ref) async {
    switch (action.action) {
      case QuickActionType.addTask:
        await _showAddTaskModal(context);
      case QuickActionType.addHorse:
        await _showAddHorseDialog(context, ref);
      case QuickActionType.logRide:
        await _showLogRideDialog(context, ref);
      case QuickActionType.createInvoice:
        _navigateToCreateInvoice(context);
    }
  }

  Future<void> _showAddTaskModal(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.25),
      builder: (context) => Material(
        color: Colors.transparent,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: 16.borderRadiusT,
          ),
          child: SafeArea(
            top: false,
            child: AddTaskForm(createdAt: DateTime.now()),
          ),
        ),
      ),
    );
  }

  Future<void> _showAddHorseDialog(BuildContext context, WidgetRef ref) async {
    final result = await AddEditHorseDialog.show(context);
    if (result != null) {
      ref.read(fetchHorsesProvider.notifier).addHorse(result);
    }
  }

  Future<void> _showLogRideDialog(BuildContext context, WidgetRef ref) async {
    // Get horses available
    final horsesState = ref.read(fetchHorsesProvider);
    final horses = horsesState.horses;

    if (horses.isEmpty) {
      context.showError(
        title: context.l10n.noHorsesAvailable,
        subtitle: context.l10n.pleaseAddAHorseFirst,
      );
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.25),
      builder: (context) => _SelectHorseForRideLog(horses: horses),
    );
  }

  void _navigateToCreateInvoice(BuildContext context) {
    context.pushNamed(CreateEditInvoiceScreen.name);
  }
}

/// Dialog to select a horse before opening ride log
class _SelectHorseForRideLog extends ConsumerWidget {
  const _SelectHorseForRideLog({required this.horses});

  final List<HorseModel> horses;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: Colors.transparent,
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.6,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: 16.borderRadiusT,
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Text(
                      context.l10n.selectHorse,
                      style: context.titleLarge,
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: horses.length,
                  itemBuilder: (context, index) {
                    final horse = horses[index];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor:
                            context.primaryColor.withValues(alpha: 0.1),
                        child: Icon(
                          GLIcons.horse,
                          color: context.primaryColor,
                          size: 20,
                        ),
                      ),
                      title: Text(horse.name),
                      subtitle:
                          Text(horse.breed.label(context.l10n.localeName)),
                      onTap: () async {
                        Navigator.of(context).pop();
                        // Open ride log dialog for selected horse
                        await showModalBottomSheet<void>(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          barrierColor: Colors.black.withValues(alpha: 0.25),
                          builder: (context) => AddEditRideLogDialog(
                            horseId: horse.id,
                            barnId: horse.barnId,
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
