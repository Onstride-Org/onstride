import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/providers/account/account_provider.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class BarnStallSelector extends ConsumerStatefulWidget {
  const BarnStallSelector({
    required this.onChanged,
    this.horse,
    super.key,
  });

  final ValueChanged<StallPosition?> onChanged;
  final HorseModel? horse;

  @override
  ConsumerState<BarnStallSelector> createState() => _BarnStallSelectorState();
}

class _BarnStallSelectorState extends ConsumerState<BarnStallSelector> {
  List<StallPosition> stalls = [];
  StallPosition? position;

  @override
  void initState() {
    super.initState();
    position = ref
        .read(accountProvider.notifier)
        .getStallPositionById(widget.horse?.stallId);
    stalls = ref.read(accountProvider.notifier).getStallPositions();

    if (stalls.isNotEmpty) {
      if (widget.horse?.stallId == null) {
        stalls = stalls.where((stall) => stall.isFree).toList();
      } else {
        stalls = stalls
            .where((stall) => stall.isFree || stall.id == widget.horse!.stallId)
            .toList();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (stalls.isEmpty) {
      return GLDropdown<StallPosition>(
        items: const [],
        onChanged: widget.onChanged,
        selectedValue: null,
        itemBuilder: (item) => const Text(''),
        hintLabel: context.l10n.noStallsYet,
        selectedItemBuilder: (selected) => const Text(''),
      );
    }

    return GLDropdown<StallPosition>(
      items: stalls,
      onChanged: (value) {
        setState(() {
          position = value;
          widget.onChanged(value);
        });
      },
      selectedValue: position,
      suffix: position != null
          ? GestureDetector(
              onTap: () {
                setState(() {
                  position = null;
                  widget.onChanged(null);
                });
              },
              child: Icon(GLIcons.x, size: 16.sp),
            )
          : null,
      itemBuilder: (item) {
        return Text(item.stallName);
      },
      hintLabel: context.l10n.selectOption,
      selectedItemBuilder: (selected) => Text(selected.stallName),
    );
  }
}
