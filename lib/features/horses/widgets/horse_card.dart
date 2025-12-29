import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/horses/screens/horse_profile_view.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class HorseCard extends ConsumerWidget {
  const HorseCard({
    required this.horse,
    super.key,
  });

  final HorseModel horse;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(fetchUsersProvider);
    final boarder = state.getUserById(horse.boarderId ?? '');
    return SizedBox(
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: GLColors.neutral1000, width: 1.5),
        ),
        child: Padding(
          padding: [16, 12].edgeInsetsHV,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              HorseInfoText(
                firstText: horse.name,
                secondText: horse.sexStatus.label(context.l10n.localeName),
                firstFontSize: 17,
                firstFontWeight: FontWeight.w500,
                secondTextColor: GLColors.neutral800,
                secondFontWeight: FontWeight.w400,
              ),
              GLSpaces.px2,
              Expanded(
                child: HorseInfoText(
                  firstText: horse.breed.label(context.l10n.localeName),
                  secondText: horse.ageLabel(context.l10n),
                  firstFontSize: 13,
                  secondFontSize: 13,
                  firstTextColor: GLColors.neutral700,
                  secondTextColor: GLColors.neutral700,
                  firstFontWeight: FontWeight.w400,
                  secondFontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 8),
              HorseBoarder(
                name: horse.boarderId == null ? '---' : boarder?.name ?? '---',
              ),
              ViewDetail(
                onPressed: () {
                  context.goNamed(
                    HorseProfileView.name,
                    pathParameters: {'id': horse.id},
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class HorseBoarder extends StatelessWidget {
  const HorseBoarder({
    required this.name,
    super.key,
  });

  final String name;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          GLIcons.useroutline,
          size: 14.sp,
          color: GLColors.neutral700,
        ),
        GLSpaces.px2,
        Expanded(
          child: Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w400,
              color: GLColors.neutral700,
            ),
          ),
        ),
      ],
    );
  }
}

class HorseInfoText extends StatelessWidget {
  const HorseInfoText({
    required this.firstText,
    required this.secondText,
    super.key,
    this.firstTextColor,
    this.secondTextColor,
    this.firstFontSize,
    this.secondFontSize,
    this.firstFontWeight,
    this.secondFontWeight,
    this.textGap = 4.0,
  });

  final String firstText;
  final String secondText;

  final Color? firstTextColor;
  final Color? secondTextColor;

  final double? firstFontSize;
  final double? secondFontSize;

  final FontWeight? firstFontWeight;
  final FontWeight? secondFontWeight;

  final double textGap;

  @override
  Widget build(BuildContext context) {
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: firstText,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontSize: firstFontSize,
                fontWeight: firstFontWeight,
                color: firstTextColor,
              ),
            ),
            WidgetSpan(
              child: SizedBox(width: textGap),
            ),
            TextSpan(
              text: secondText,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontSize: secondFontSize,
                fontWeight: secondFontWeight,
                color: secondTextColor,
              ),
            ),
          ],
        ),
        textAlign: TextAlign.left,
        maxLines: 1,
      ),
    );
  }
}
