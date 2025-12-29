import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/multi_barn/providers/providers.dart';
import 'package:models/models.dart';

/// A dropdown widget that allows users to switch between barns they belong to.
class BarnSwitcher extends ConsumerWidget {
  const BarnSwitcher({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(fetchUserBarnsProvider);
    final user = ref.watch(accountProvider).currentUser;

    return state.when(
      initial: () => const SizedBox.shrink(),
      loading: () => const SizedBox(
        width: 24,
        height: 24,
        child: CircularProgressIndicator(strokeWidth: 2),
      ),
      error: (message) => const SizedBox.shrink(),
      success: (barns, currentBarn) {
        if (barns.length <= 1) {
          // Only show switcher if user has multiple barns
          return currentBarn != null
              ? _BarnChip(barn: currentBarn)
              : const SizedBox.shrink();
        }

        return GLPopupMenuButton<String>(
          itemHeight: 48,
          onSelected: (barnId) {
            ref.read(fetchUserBarnsProvider.notifier).switchBarn(
                  userId: user.id,
                  barnId: barnId,
                );
          },
          items: barns.map((barn) {
            return GLPopupItem(
              value: barn.id,
              onTap: () {
                ref.read(fetchUserBarnsProvider.notifier).switchBarn(
                      userId: user.id,
                      barnId: barn.id,
                    );
              },
              child: Row(
                children: [
                  if (barn.logoUrl != null)
                    CircleAvatar(
                      radius: 16,
                      backgroundImage: NetworkImage(barn.logoUrl!),
                    )
                  else
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: GLColors.brand100,
                      child: Text(
                        barn.name.isNotEmpty
                            ? barn.name[0].toUpperCase()
                            : 'B',
                        style: const TextStyle(
                          color: GLColors.brand800,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  GLSpaces.px12,
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          barn.name,
                          style: context.bodyMedium,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          barn.userRole.displayName,
                          style: context.bodySmall.copyWith(
                            color: GLColors.neutral500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (barn.isPrimary)
                    const Icon(
                      Icons.check_circle,
                      color: GLColors.brand600,
                      size: 18,
                    ),
                ],
              ),
            );
          }).toList(),
          child: _BarnChip(barn: currentBarn),
        );
      },
    );
  }
}

class _BarnChip extends StatelessWidget {
  const _BarnChip({required this.barn});

  final BarnSummary? barn;

  @override
  Widget build(BuildContext context) {
    if (barn == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: GLColors.brand50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: GLColors.brand200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (barn!.logoUrl != null)
            CircleAvatar(
              radius: 12,
              backgroundImage: NetworkImage(barn!.logoUrl!),
            )
          else
            CircleAvatar(
              radius: 12,
              backgroundColor: GLColors.brand200,
              child: Text(
                barn!.name.isNotEmpty
                    ? barn!.name[0].toUpperCase()
                    : 'B',
                style: const TextStyle(
                  fontSize: 10,
                  color: GLColors.brand800,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          GLSpaces.px8,
          Text(
            barn!.name,
            style: context.bodySmall.copyWith(
              color: GLColors.brand800,
              fontWeight: FontWeight.w500,
            ),
          ),
          GLSpaces.px4,
          const Icon(
            Icons.keyboard_arrow_down,
            size: 16,
            color: GLColors.brand600,
          ),
        ],
      ),
    );
  }
}
