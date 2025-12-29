import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/features.dart';

class ManageHorses extends ConsumerWidget {
  const ManageHorses({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(
      children: [
        Text(
          'Horses',
          style: context.headlineSmall,
        ),
        const Spacer(),
        FloatingActionButton(
          onPressed: () async {
            final res = await AddEditHorseDialog.show(context);
            if (res != null) {
              ref.read(fetchHorsesProvider.notifier).addHorse(res);
            }
          },
          backgroundColor: context.primaryColor,
          mini: true,
          shape: const StadiumBorder(),
          child: const Icon(Icons.add, color: Colors.white, size: 24),
        ),
      ],
    );
  }
}
