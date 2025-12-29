import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

/// First step: select barn shape
class BarnShapeSelector extends StatelessWidget {
  const BarnShapeSelector({
    super.key,
    required this.selected,
    required this.onSelect,
    required this.onContinue,
    this.enabledCancel = false,
    this.onCancel,
  });

  final BarnShape? selected;
  final ValueChanged<BarnShape> onSelect;
  final VoidCallback onContinue;
  final bool enabledCancel;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;

    const options = <BarnShape>[
      BarnShape.aisles,
      BarnShape.circle,
      BarnShape.lShape,
    ];

    String titleFor(BarnShape shape) => switch (shape) {
      BarnShape.aisles => l10n.barnShapeWithAisles,
      BarnShape.circle => l10n.barnShapeCircular,
      BarnShape.lShape => l10n.barnShapeLShape,
    };

    String subtitleFor(BarnShape shape) => switch (shape) {
      BarnShape.aisles => l10n.barnShapeWithAislesSubtitle,
      BarnShape.circle => l10n.barnShapeCircularSubtitle,
      BarnShape.lShape => l10n.barnShapeLShapeSubtitle,
    };

    return SafeArea(
      child: Padding(
        padding: 24.edgeInsetsH,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.selectBarnShape,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
            GLSpaces.px8,
            Text(
              l10n.setupBarnIntro,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w400,
                color: GLColors.neutral600,
              ),
            ),
            GLSpaces.px32,
            ...options.map(
              (shape) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: BarnShapeOptionCard(
                  title: titleFor(shape),
                  subtitle: subtitleFor(shape),
                  selected: selected == shape,
                  onTap: () => onSelect(shape),
                ),
              ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: selected == null ? null : onContinue,
                style: GLButtonStyles.primaryM,
                child: Text(l10n.continueCta),
              ),
            ),
            if (enabledCancel) ...[
              GLSpaces.px8,
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onCancel,
                  style: GLButtonStyles.outlineM,
                  child: Text(l10n.cancelCta),
                ),
              ),
            ],
            GLSpaces.px24,
          ],
        ),
      ),
    );
  }
}

/// Option card for a single BarnShape
class BarnShapeOptionCard extends StatelessWidget {
  const BarnShapeOptionCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final borderColor = selected ? GLColors.brand300 : GLColors.neutral1000;
    final titleColor = selected ? GLColors.brand500 : null;
    final subtitleColor = selected ? GLColors.brand500 : GLColors.neutral700;

    // Using Material + InkWell ensures proper ripple
    return Material(
      color: Colors.transparent,
      borderRadius: 12.borderRadiusA,
      child: InkWell(
        borderRadius: 12.borderRadiusA,
        onTap: onTap,
        child: AnimatedContainer(
          duration: kThemeAnimationDuration,
          padding: 16.edgeInsetsA,
          decoration: BoxDecoration(
            color: context.backgroundColor,
            border: Border.all(color: borderColor),
            borderRadius: 12.borderRadiusA,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  color: titleColor,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                subtitle,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: subtitleColor,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
