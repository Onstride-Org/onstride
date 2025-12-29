import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

/// Widget displaying barn overview stats for admins/owners.
class BarnSummaryWidget extends ConsumerWidget {
  const BarnSummaryWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(accountProvider).currentUser;
    final barn = ref.watch(accountProvider).currentBarn;

    // Only show for owners and managers
    if (!user.isOwner && !user.isManager) {
      return const SizedBox.shrink();
    }

    final horsesState = ref.watch(fetchHorsesProvider);
    final usersState = ref.watch(fetchUsersProvider);

    // Get counts from state
    final horseCount = horsesState.horses.length;
    final activeHorseCount = horsesState.horses
        .where((h) => h.status == HorseStatus.active)
        .length;

    final userCount = usersState.allUsers.length;
    final boarderCount = usersState.boarders.length;

    final today = DateTime.now();
    final tasks =
        ref.read(getTaskListProvider.notifier).getTasksFromState(today);
    final pendingTaskCount =
        tasks.where((t) => t.status != TaskStatus.completed).length;
    final overdueTaskCount = tasks
        .where((t) =>
            t.status == TaskStatus.overdue ||
            (t.dueDate.isBefore(DateTime.now()) &&
                t.status != TaskStatus.completed))
        .length;

    return DashboardCard(
      title: context.l10n.barnOverview,
      icon: Icons.analytics_outlined,
      trailing: barn != null
          ? Text(
              barn.name,
              style: context.bodySmall.copyWith(color: context.hintColor),
            )
          : null,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    icon: GLIcons.horse,
                    label: context.l10n.horses,
                    value: '$activeHorseCount',
                    subValue: horseCount != activeHorseCount
                        ? '($horseCount ${context.l10n.total})'
                        : null,
                    color: Colors.green,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    icon: GLIcons.useroutline,
                    label: context.l10n.boarders,
                    value: '$boarderCount',
                    subValue: '$userCount ${context.l10n.total}',
                    color: Colors.blue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    icon: GLIcons.taskoutline,
                    label: context.l10n.pendingTasks,
                    value: '$pendingTaskCount',
                    color: Colors.orange,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    icon: Icons.warning_amber_rounded,
                    label: context.l10n.overdue,
                    value: '$overdueTaskCount',
                    color: overdueTaskCount > 0 ? Colors.red : Colors.grey,
                    isWarning: overdueTaskCount > 0,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.subValue,
    this.isWarning = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final String? subValue;
  final Color color;
  final bool isWarning;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isWarning
            ? color.withValues(alpha: 0.1)
            : GLColors.neutral1100.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(8),
        border: isWarning ? Border.all(color: color.withValues(alpha: 0.3)) : null,
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isWarning ? color : null,
                  ),
                ),
                Text(
                  label,
                  style: context.bodySmall.copyWith(
                    color: context.hintColor,
                    fontSize: 11,
                  ),
                ),
                if (subValue != null)
                  Text(
                    subValue!,
                    style: context.bodySmall.copyWith(
                      color: context.hintColor,
                      fontSize: 10,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
