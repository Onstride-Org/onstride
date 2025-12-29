// lib/features/barns/pages/barn_setup_page.dart
import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/barns/dialogs/assign_to_horse_stall_dialog.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/horses/screens/horse_profile_view.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class BarnSetupPage extends ConsumerStatefulWidget {
  const BarnSetupPage({
    required this.initialIndex,
    this.showGreeting = false,
    super.key,
  });

  final bool showGreeting;
  final int initialIndex;

  @override
  ConsumerState<BarnSetupPage> createState() => _BarnSetupPageState();
}

class _BarnSetupPageState extends ConsumerState<BarnSetupPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    _tabController = TabController(
      length: 3,
      vsync: this,
      initialIndex: widget.initialIndex,
    );
    WidgetsBinding.instance.addPostFrameCallback(
      (_) {
        final currentBarn = ref.read(accountProvider).currentBarn;
        ref.read(barnSetupControllerProvider.notifier).setBarn(currentBarn);
      },
    );
    super.initState();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _statusListener(BarnSetupState? previous, BarnSetupState next) {
    switch (next.status) {
      case RequestStatus.initial:
        return;
      case RequestStatus.loading:
        return showInvisibleLoadingDialog(context);
      case RequestStatus.success:
        context.pop();
        _tabController.animateTo(2);
        FocusScope.of(context).requestFocus(FocusNode());
        final currentBarn = ref.read(accountProvider).currentBarn;
        final removed =
            currentBarn?.removedPositions(next.barn!.setup!.stalls) ?? {};
        for (final r in removed.entries) {
          final horseId = r.value.horseId;
          if (horseId != null) {
            ref
                .read(fetchHorsesProvider.notifier)
                .updateHorseStall(horseId: horseId);
          }
        }
        ref.read(accountProvider.notifier).setBarn(next.barn!);
        return;
      case RequestStatus.error:
        context.pop();
        return context.showDataException(next.exception!);
    }
  }

  void _updateBarnStallListener(
    UpdateBarnPositionState? previous,
    UpdateBarnPositionState next,
  ) {
    switch (next) {
      case InitialUpdateBarnPositionState():
        return;
      case LoadingUpdateBarnPositionState():
        return showInvisibleLoadingDialog(context);
      case SuccessUpdateBarnPositionState(:final barn, :final stall):
        context.pop();
        ref.read(accountProvider.notifier).setBarn(barn);
        if (stall.horseId != null) {
          ref
              .read(fetchHorsesProvider.notifier)
              .updateHorseStall(
                horseId: stall.horseId ?? '',
                stallId: stall.id,
              );
          return context.showSuccess(title: context.l10n.horseAddedSuccess);
        } else {
          return context.showSuccess(title: context.l10n.horseRemovedSuccess);
        }
      case ErrorUpdateBarnPositionState(:final exception):
        context.pop();
        return context.showDataException(exception);
    }
  }

  @override
  Widget build(BuildContext context) {
    final setupState = ref.watch(barnSetupControllerProvider);
    final selectedShape = setupState.shape;
    ref.listen(barnSetupControllerProvider, _statusListener);
    final barn = ref.watch(accountProvider).currentBarn;
    final user = ref.watch(accountProvider).currentUser;
    ref.listen(updateBarnPositionProvider, _updateBarnStallListener);
    return AnimatedBuilder(
      animation: _tabController,
      builder: (context, child) {
        final index = _tabController.index;
        return Scaffold(
          appBar: index == 2
              ? GLAuthUserAppBar(
                  leading: const Icon(GLIcons.stablefilled_1),
                  title: Text(
                    barn?.name ?? context.l10n.stableTitle,
                    style: context.titleMedium.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  actions: [
                    if (user.canManageBarn)
                      IconButton(
                        onPressed: () => _tabController.animateTo(0),
                        iconSize: 24.sp,
                        icon: const Icon(GLIcons.editcircle),
                      ),
                    GLSpaces.px12,
                  ],
                )
              : const GLAuthUserAppBar(),
          body: child,
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.showGreeting) ...[
            GLWelcomeGreeting(user: user),
            GLSpaces.px16,
          ],
          if (setupState.setup == null) ...[
            GLSpaces.px16,
            Padding(
              padding: 24.edgeInsetsH,
              child: Text(
                context.l10n.stableTitle,
                style: context.headlineSmall,
              ),
            ),
            GLSpaces.px16,
          ],
          Expanded(
            child: TabBarView(
              controller: _tabController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                AbsorbPointer(
                  absorbing: !user.canManageBarn,
                  child: Opacity(
                    opacity: user.canManageBarn ? 1 : .5,
                    child: BarnShapeSelector(
                      selected: selectedShape,
                      enabledCancel: barn?.setup != null,
                      onSelect: (shape) {
                        ref
                            .read(barnSetupControllerProvider.notifier)
                            .selectShape(shape);
                      },
                      onCancel: () {
                        _tabController.animateTo(2);
                        final shape = barn?.setup?.shape;
                        if (shape == null) return;
                        ref
                            .read(barnSetupControllerProvider.notifier)
                            .selectShape(shape);
                      },
                      onContinue: () => _tabController.animateTo(1),
                    ),
                  ),
                ),
                AbsorbPointer(
                  absorbing: !user.canManageBarn,
                  child: Opacity(
                    opacity: user.canManageBarn ? 1 : .5,
                    child: BarnSetupForm(
                      setup: barn?.setup,
                      shape: selectedShape,
                      onCancel: () => _tabController.animateTo(0),
                      onContinue: (data) {
                        ref
                            .read(barnSetupControllerProvider.notifier)
                            .setSetup(data);
                        final updated = barn?.copyWith(
                          setup: data,
                        );
                        if (updated != null) {
                          ref.read(accountProvider.notifier).setBarn(updated);
                        }
                      },
                    ),
                  ),
                ),
                if (barn != null)
                  Column(
                    children: [
                      Padding(
                        padding: 24.edgeInsetsH,
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                context.l10n.tapToAssignHorse,
                                style: context.labelMedium.copyWith(
                                  color: GLColors.neutral600,
                                ),
                              ),
                            ),
                            // IconButton(
                            //   style: IconButton.styleFrom(
                            //     foregroundColor: context.primaryColor,
                            //   ),
                            //   onPressed: () => _tabController.animateTo(0),
                            //   icon: const Icon(GLIcons.editcircle),
                            // ),
                          ],
                        ),
                      ),
                      GLSpaces.px12,
                      Expanded(
                        child: BarnLayoutView(
                          barn: barn,
                          enabledTaps: user.canManageHorses,
                          onTapPosition: (stall) async {
                            final horseId = await showAssignHorseToStallDialog(
                              context,
                              position: stall,
                            );
                            if (horseId != null) {
                              await ref
                                  .read(updateBarnPositionProvider.notifier)
                                  .setHorseToTheStall(
                                    barn: barn,
                                    stall: stall.copyWith(horseId: horseId),
                                  );
                            }
                          },
                          onTapViewHorse: (stall) {
                            context.goNamed(
                              HorseProfileView.name,
                              pathParameters: {'id': stall.horseId ?? ''},
                            );
                          },
                          onTapDeleteOption: (stall) async {
                            final horseId = stall.horseId;
                            if (horseId == null) return;
                            final horse = ref
                                .read(fetchHorsesProvider)
                                .getHorseById(horseId);
                            final confirmation = await ConfirmDialog.show(
                              context,
                              title: context.l10n.confirmRemoveHorseTitle,
                              description: context.l10n
                                  .confirmRemoveHorseDescription(
                                    horse?.name ?? '',
                                    stall.stallName,
                                  ),
                            );
                            if (confirmation != null && confirmation) {
                              await ref
                                  .read(updateBarnPositionProvider.notifier)
                                  .removeHorseFromStall(
                                    barn: barn,
                                    stall: stall,
                                  );
                              ref
                                  .read(fetchHorsesProvider.notifier)
                                  .updateHorseStall(
                                    horseId: horseId,
                                  );
                            }
                          },
                          onContinue: () {},
                          onCancel: () {},
                        ),
                      ),
                    ],
                  )
                else
                  const SizedBox.shrink(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
