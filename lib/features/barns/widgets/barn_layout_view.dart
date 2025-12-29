import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/barns/widgets/layouts/layouts.dart';
import 'package:gl_horses/features/features.dart';
import 'package:models/models.dart';

class BarnLayoutView extends ConsumerStatefulWidget {
  const BarnLayoutView({
    required this.enabledTaps,
    required this.barn,
    required this.onTapPosition,
    required this.onTapDeleteOption,
    required this.onTapViewHorse,
    required this.onContinue,
    required this.onCancel,
    super.key,
  });

  final BarnModel barn;
  final VoidCallback onContinue;
  final VoidCallback onCancel;
  final ValueChanged<StallPosition> onTapPosition;
  final ValueChanged<StallPosition> onTapDeleteOption;
  final ValueChanged<StallPosition> onTapViewHorse;
  final bool enabledTaps;

  @override
  ConsumerState<BarnLayoutView> createState() => _BarnLayoutViewState();
}

class _BarnLayoutViewState extends ConsumerState<BarnLayoutView> {
  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback(
      (_) {
        final user = ref.read(accountProvider).currentUser;
        if (user.canManageHorses || user.canManageBarn) {
          ref.read(fetchHorsesProvider.notifier).fetchAllHorses();
        }
      },
    );
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final setup = widget.barn.setup!;
    final state = ref.watch(fetchHorsesProvider);

    switch (setup.shape) {
      case BarnShape.aisles:
        return BarnWithAislesLayout(
          barn: widget.barn,
          enabledTaps: widget.enabledTaps,
          onTapPosition: widget.onTapPosition,
          onTapDeleteOption: widget.onTapDeleteOption,
          onTapViewHorse: widget.onTapViewHorse,
        );
      case BarnShape.circle:
        return BarnCircularStackLayout(
          barn: widget.barn,
          enabledTaps: widget.enabledTaps,
          onTapPosition: widget.onTapPosition,
          horseNameResolver: (id) {
            return state.getHorseById(id)?.name;
          },
          circleRadiusFactor: 0.5,
          ringGap: 20,
          onTapDeleteOption: widget.onTapDeleteOption,
          onTapViewHorse: widget.onTapViewHorse,
        );
      case BarnShape.lShape:
        return BarnLShapeLayout(
          barn: widget.barn,
          enabledTaps: widget.enabledTaps,
          onTapPosition: widget.onTapPosition,
          onTapDeleteOption: widget.onTapDeleteOption,
          onTapViewHorse: widget.onTapViewHorse,
        );
    }
  }
}
