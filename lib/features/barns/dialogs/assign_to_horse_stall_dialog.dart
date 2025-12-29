import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart'; // donde vive fetchHorsesProvider
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

Future<String?> showAssignHorseToStallDialog(
  BuildContext context, {
  required StallPosition position,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => FractionallySizedBox(
      heightFactor: 0.8,
      child: AssignHorseToStallDialog(position: position),
    ),
  );
}

class AssignHorseToStallDialog extends ConsumerStatefulWidget {
  const AssignHorseToStallDialog({
    required this.position,
    super.key,
  });

  final StallPosition position;

  @override
  ConsumerState<AssignHorseToStallDialog> createState() =>
      _AssignHorseToStallDialogState();
}

class _AssignHorseToStallDialogState
    extends ConsumerState<AssignHorseToStallDialog> {
  String? _selectedHorseId;
  final _scrollCtrl = ScrollController();
  bool _isPaging = false;

  @override
  void initState() {
    super.initState();
    _selectedHorseId = widget.position.horseId;

    _scrollCtrl.addListener(() {
      final state = ref.read(fetchHorsesProvider);
      if (_scrollCtrl.position.pixels >=
              _scrollCtrl.position.maxScrollExtent - 200 &&
          !_isPaging &&
          !state.isLoading &&
          !state.isSearching) {
        _isPaging = true;
        ref.read(fetchHorsesProvider.notifier).fetch().whenComplete(() {
          Future.delayed(const Duration(milliseconds: 120), () {
            if (mounted) _isPaging = false;
          });
        });
      }
    });
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    await ref.read(fetchHorsesProvider.notifier).fetch(reload: true);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = ref.watch(fetchHorsesProvider);
    final horses = [
      ...state.horses,
    ]..removeWhere((e) => e.stallId != null && e.stallId != -1);

    final usersState = ref.read(fetchUsersProvider);

    return SafeArea(
      top: false,
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        child: Material(
          color: context.backgroundColor,
          child: Padding(
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 10,
              bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 36,
                  height: 4,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: GLColors.neutral700,
                      borderRadius: 2.borderRadiusA,
                    ),
                  ),
                ),
                GLSpaces.px24,
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    context.l10n.assignHorseTitle(widget.position.stallName),
                    style: theme.textTheme.titleLarge,
                  ),
                ),
                GLSpaces.px8,
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    context.l10n.assignHorseSubtitle,
                    maxLines: 5,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w300,
                    ),
                  ),
                ),
                GLSpaces.px24,
                Expanded(
                  child: horses.isEmpty
                      ? Padding(
                          padding: EdgeInsets.symmetric(horizontal: 0.1.sw),
                          child: NotResultsWidget.data(
                            title: state.horses.isNotEmpty
                                ? context
                                      .l10n
                                      .allHorsesAreAlreadyAssignedToStalls
                                : context.l10n.youHavenTSetAnyHorseYet,
                            description: '',
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _onRefresh,
                          child: ListView.separated(
                            controller: _scrollCtrl,
                            physics: const AlwaysScrollableScrollPhysics(),
                            itemCount:
                                horses.length + (state.isLoading ? 1 : 0),
                            separatorBuilder: (_, __) => GLSpaces.px12,
                            itemBuilder: (_, i) {
                              if (i >= horses.length) {
                                return Padding(
                                  padding: 16.edgeInsetsV,
                                  child: Center(
                                    child: GLBouncingDotsIndicator(size: 8.sp),
                                  ),
                                );
                              }

                              final horse = horses[i];
                              final isSelected = horse.id == _selectedHorseId;
                              final boarder = usersState.getUserById(
                                horse.boarderId,
                              );

                              return _HorseSelectableTile(
                                selected: isSelected,
                                boarder: boarder,
                                horse: horse,
                                onTap: () => setState(() {
                                  _selectedHorseId = isSelected
                                      ? null
                                      : horse.id;
                                }),
                              );
                            },
                          ),
                        ),
                ),

                GLSpaces.px16,
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: GLButtonStyles.outlineM,
                        onPressed: () => Navigator.of(context).pop(),
                        child: Text(context.l10n.cancel),
                      ),
                    ),
                    GLSpaces.px12,
                    Expanded(
                      child: ElevatedButton(
                        style: GLButtonStyles.primaryM,
                        onPressed: _selectedHorseId == null
                            ? null
                            : () => context.pop(_selectedHorseId),
                        child: Text(context.l10n.save),
                      ),
                    ),
                  ],
                ),
                GLSpaces.px8,
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HorseSelectableTile extends StatelessWidget {
  const _HorseSelectableTile({
    required this.selected,
    required this.onTap,
    required this.horse,
    required this.boarder,
  });

  final bool selected;
  final VoidCallback onTap;
  final HorseModel horse;
  final GLUser? boarder;

  @override
  Widget build(BuildContext context) {
    final border = selected ? GLColors.brand300 : GLColors.neutral1000;
    final bg = selected ? GLColors.brand50 : context.backgroundColor;

    final fontColor = selected ? null : GLColors.neutral600;

    return InkWell(
      borderRadius: 16.borderRadiusA,
      onTap: onTap,
      child: AnimatedContainer(
        duration: kThemeAnimationDuration,
        padding: 12.edgeInsetsA,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: 12.borderRadiusA,
          border: Border.all(color: border),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  HorseInfoText(
                    firstText: horse.name,
                    secondText: horse.sexStatus.label(context.l10n.locale),
                    secondFontSize: 11.sp,
                    secondFontWeight: FontWeight.w400,
                    secondTextColor: fontColor,
                  ),
                  DefaultTextStyle(
                    style: context.labelMedium.copyWith(
                      fontWeight: FontWeight.w300,
                      color: fontColor,
                    ),
                    child: Row(
                      children: [
                        Text(
                          horse.breed.label(context.l10n.locale),
                        ),
                        GLSpaces.px4,
                        Text(
                          horse.ageLabel(context.l10n),
                        ),
                        GLSpaces.px4,
                        Icon(
                          GLIcons.useroutline,
                          size: 11.sp,
                          color: fontColor,
                        ),
                        Flexible(
                          child: Text(
                            boarder?.name ?? '---',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            GLSpaces.px12,
          ],
        ),
      ),
    );
  }
}
