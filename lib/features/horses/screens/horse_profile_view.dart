import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/horses/providers/load_horse_tasks/load_horse_tasks.dart';
import 'package:gl_horses/features/horses/providers/load_horse_tasks/load_horse_tasks_state.dart';
import 'package:gl_horses/features/horses/services/horse_export_service.dart';
import 'package:gl_horses/features/tasks/providers/get_boarder_horses/get_boarder_horses_provider.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

class HorseProfileView extends ConsumerStatefulWidget {
  const HorseProfileView({
    required this.horseId,
    super.key,
  });

  final String horseId;

  static const path = 'horse-profile:id';
  static const name = 'horse-profile';

  @override
  ConsumerState<HorseProfileView> createState() => _HorseProfileViewState();
}

class _HorseProfileViewState extends ConsumerState<HorseProfileView> {
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(loadHorseTasksProvider.notifier).loadHorseTasks(widget.horseId);
      ref.read(fetchUsersProvider.notifier).fetchAllUsers();
    });
  }

  @override
  Widget build(BuildContext context) {
    _errorWhenLoadingTasks(context);

    final tasksState = ref.watch(loadHorseTasksProvider);
    final horse =
        ref.watch(fetchHorsesProvider).getHorseById(widget.horseId) ??
        ref.watch(getBoarderHorsesProvider).getHorseById(widget.horseId);

    final stall = ref
        .read<Account>(accountProvider.notifier)
        .getStallPositionById(horse?.stallId);
    final date = DateFormat(
      'MMMM dd, yyyy',
    ).format(horse?.birthday ?? DateTime.now());

    final boarder = ref
        .watch(fetchUsersProvider)
        .getUserById(horse!.boarderId ?? '');
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: HorseProfileAppBar(horse: horse),
      body: SafeArea(
        child: horse != null
            ? SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _StatusChip(
                        label: horse.status == HorseStatus.active
                            ? context.l10n.horseStatusActive
                            : context.l10n.horseStatusInactive,
                        status: horse.status == HorseStatus.active
                            ? HorseStatus.active
                            : HorseStatus.inactive,
                      ),
                      GLSpaces.px24,
                      Text(
                        horse.name,
                        style: Theme.of(context).textTheme.displaySmall
                            ?.copyWith(
                              color: context.primaryColor,
                              height: 1.1,
                            ),
                      ),
                      GLSpaces.px12,
                      Text(
                        '${context.l10n.stallLabel} ${stall?.stallName ?? '-'}',
                      ),
                      GLSpaces.px8,
                      _HorseCharacteristics(
                        values: [
                          horse.breed.label(context.l10n.localeName),
                          horse.sexStatus.label(context.l10n.localeName),
                          '${horse.color}',
                        ],
                      ),
                      GLSpaces.px8,
                      IconsAndTextsRow(
                        items: [
                          IconAndText(text: date, iconData: GLIcons.calendar),
                          IconAndText(
                            text: boarder?.name ?? '---',
                            iconData: GLIcons.useroutline,
                          ),
                        ],
                      ),
                      GLSpaces.px48,
                      RideLogList(
                        horseId: horse.id,
                        barnId: horse.barnId,
                      ),
                      GLSpaces.px24,
                      HorseDocumentList(horse: horse),
                      GLSpaces.px8,
                      _TaskList(state: tasksState),
                    ],
                  ),
                ),
              )
            : const SizedBox.shrink(),
      ),
    );
  }

  void _errorWhenLoadingTasks(BuildContext context) {
    ref.listen<LoadHorseTasksState>(loadHorseTasksProvider, (previous, next) {
      if (next is ErrorLoadHorseTasksState) {
        context.showDataException(next.exception);
      }
    });
  }
}

class _TaskList extends StatelessWidget {
  const _TaskList({required this.state});

  final LoadHorseTasksState state;

  @override
  Widget build(BuildContext context) {
    final isLoading = state is LoadingLoadHorseTasksState;
    final tasks = state is SuccessLoadHorseTasksState
        ? (state as SuccessLoadHorseTasksState).tasks
        : const <TaskModel>[];

    final now = DateTime(
      DateTime.now().year,
      DateTime.now().month,
      DateTime.now().day,
    );
    final sortedTasks = [...tasks]
      ..sort((a, b) {
        final differenceA = a.createdAt.difference(now).abs();
        final differenceB = b.createdAt.difference(now).abs();
        return differenceA.compareTo(differenceB);
      });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(context.l10n.lastTasksTitle, style: context.headlineSmall),
        GLSpaces.px16,
        if (isLoading) ...[
          const Center(child: GLBouncingDotsIndicator()),
        ] else if (sortedTasks.isEmpty) ...[
          Align(
            alignment: Alignment.centerLeft,
            child: Text(context.l10n.noTasksLabel),
          ),
        ] else ...[
          ...sortedTasks.map(
            (task) => TaskCardTile(task: task, onTap: null),
          ),
        ],
      ],
    );
  }
}

class HorseProfileAppBar extends ConsumerWidget implements PreferredSizeWidget {
  const HorseProfileAppBar({
    required this.horse,
    super.key,
  });

  final HorseModel horse;

  @override
  Size get preferredSize => const Size.fromHeight(56);

  Future<void> _shareHorseProfile(
    BuildContext context,
    WidgetRef ref,
    HorseModel horse,
  ) async {
    // Get boarder name if available
    final boarder = ref.read(fetchUsersProvider).getUserById(horse.boarderId ?? '');
    final stall = ref.read(accountProvider.notifier).getStallPositionById(horse.stallId);

    // Get ride log data if available
    final rideLogsState = ref.read(fetchRideLogsProvider);
    List<RideLogModel>? rideLogs;
    RideLogSummary? summary;

    if (rideLogsState is SuccessFetchRideLogsState) {
      rideLogs = rideLogsState.rideLogs;
      summary = rideLogsState.summary;
    }

    await HorseExportService.shareHorseProfile(
      context: context,
      horse: horse,
      boarderName: boarder?.name,
      stallName: stall?.stallName,
      recentRideLogs: rideLogs,
      rideLogSummary: summary,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(accountProvider).currentUser;
    return AppBar(
      elevation: 8,
      forceMaterialTransparency: true,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new, size: 20),
        onPressed: context.pop,
      ),
      centerTitle: true,
      title: Text(
        context.l10n.horseProfileTitle,
        style: Theme.of(context).textTheme.titleLarge,
      ),
      actions: [
        // Share button
        IconButton(
          onPressed: () => _shareHorseProfile(context, ref, horse),
          icon: const Icon(Icons.share),
          tooltip: 'Share Profile',
        ),
        if (user.isOwner ||
            user.isBoarder ||
            (user.isEmployee && user.canManageHorses))
          IconButton(
            onPressed: () async {
              final res = await AddEditHorseDialog.show(
                context,
                horse: horse,
              );
              if (res != null) {
                if (user.isBoarder) {
                  ref.read(getBoarderHorsesProvider.notifier).updateHorse(res);
                  return;
                }
                ref.read(fetchHorsesProvider.notifier).updateHorse(res);
              }
            },
            style: IconButton.styleFrom(backgroundColor: context.primaryColor),
            icon: const Icon(
              GLIcons.edit,
              color: Colors.white,
            ),
          ),
        if (user.isOwner || user.canManageHorses) ...[
          DeleteHorseIconButton(
            horse: horse,
          ),
        ],
        GLSpaces.px4,
      ],
      bottom: const PreferredSize(
        preferredSize: Size.fromHeight(1),
        child: Divider(color: GLColors.neutral1100, height: 1),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.status});

  final String label;
  final HorseStatus status;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: status.statusColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Padding(
        padding: [8, 4].edgeInsetsHV,
        child: Text(
          label,
          style: TextStyle(
            color: status.statusFontColor,
            fontSize: 12.sp,
          ),
        ),
      ),
    );
  }
}

class _HorseCharacteristics extends StatelessWidget {
  const _HorseCharacteristics({required this.values});

  final List<String> values;

  @override
  Widget build(BuildContext context) {
    final filtered = values.where((v) => v.trim().isNotEmpty).toList();
    final items = <Widget>[];
    for (var i = 0; i < filtered.length; i++) {
      items.add(Text(filtered[i]));
      if (i < filtered.length - 1) {
        items.add(
          Padding(
            padding: 8.edgeInsetsH,
            child: const Text('-'),
          ),
        );
      }
    }
    return Row(children: items);
  }
}
