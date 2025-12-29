import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/extensions/exceptions/data_provider_exception_ext.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/horses/screens/horse_profile_view.dart';
import 'package:gl_horses/features/tasks/providers/get_boarder_horses/get_boarder_horses_provider.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class BoarderHorsesSection extends ConsumerStatefulWidget {
  const BoarderHorsesSection({super.key});

  @override
  ConsumerState createState() => _BoarderHorsesSectionState();
}

class _BoarderHorsesSectionState extends ConsumerState<BoarderHorsesSection> {
  @override
  void initState() {
    super.initState();
    // Load horses after first frame to have providers ready
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(getBoarderHorsesProvider.notifier).load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(getBoarderHorsesProvider);

    Widget content = const SizedBox.shrink();

    state.when(
      initial: () {
        content = const SizedBox.shrink();
      },
      loading: () {
        content = SizedBox(
          height: 50.h,
          child: const Center(child: GLBouncingDotsIndicator()),
        );
      },
      success: (horses) {
        if (horses.isEmpty) {
          content = SizedBox(
            height: 50.h,
            child: Center(
              child: Text(
                'No horses yet',
                style: context.bodyMedium.copyWith(color: context.hintColor),
              ),
            ),
          );
        } else {
          content = SizedBox(
            height: 50.h,
            child: OverflowBox(
              maxWidth: 1.sw,
              child: ListView.builder(
                padding: 16.edgeInsetsH,
                scrollDirection: Axis.horizontal,
                itemCount: horses.length,
                itemBuilder: (context, index) {
                  final horse = horses[index];
                  return _BoarderHorseCard(horse: horse);
                },
              ),
            ),
          );
        }
      },
      error: (exception) {
        content = AppSnackBar.error(
          title: exception.name(context.l10n),
          subtitle: exception.description(context.l10n),
          showClose: false,
        );
      },
    );

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'My horses',
                style: context.titleMedium.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            SizedBox.square(
              dimension: 30.sp,
              child: IconButton(
                onPressed: () async {
                  final horse = await AddEditHorseDialog.show(context);
                  if (horse != null) {
                    ref.read(getBoarderHorsesProvider.notifier).addHorse(horse);
                  }
                },
                iconSize: 18.sp,
                color: context.backgroundColor,
                style: IconButton.styleFrom(
                  padding: EdgeInsets.zero,
                  backgroundColor: context.primaryColor,
                ),
                icon: const Icon(GLIcons.add),
              ),
            ),
          ],
        ),
        GLSpaces.px16,
        content,
      ],
    );
  }
}

class _BoarderHorseCard extends StatelessWidget {
  const _BoarderHorseCard({
    super.key,
    required this.horse,
  });

  final HorseModel horse;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.pushNamed(
        HorseProfileView.name,
        pathParameters: {'id': horse.id},
      ),
      child: Container(
        padding: 12.edgeInsetsH,
        margin: 10.edgeInsetsR,
        decoration: BoxDecoration(
          borderRadius: 10.borderRadiusA,
          border: Border.all(color: context.hintColor),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text.rich(
              TextSpan(
                text: horse.name,
                children: [
                  const TextSpan(text: ' '),
                  TextSpan(
                    text: horse.sexStatus.label(context.l10n.locale),
                    style: context.bodySmall.copyWith(
                      color: context.hintColor,
                    ),
                  ),
                ],
              ),
              style: context.bodyMedium,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            // Breed + Age
            Text(
              '${horse.breed.label(context.l10n.locale)} '
              '${horse.ageLabel(context.l10n)}',
              style: context.labelSmall.copyWith(
                color: context.hintColor,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
