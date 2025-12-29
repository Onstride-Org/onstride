import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/users/dialogs/add_edit_user_dialog.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class UserCard extends ConsumerWidget {
  const UserCard({
    required this.user,
    super.key,
  });

  final GLUser user;

  Color get _bgColor {
    switch (user.accountType!) {
      case AccountType.owner:
        return GLColors.brand50;
      case AccountType.manager:
        return GLColors.brand50;
      case AccountType.boarder:
        return Colors.lightBlue.shade50;
      case AccountType.groomer:
        return GLColors.warning50;
      case AccountType.admin:
        return GLColors.brand50;
    }
  }

  Color get _fgColor {
    switch (user.accountType!) {
      case AccountType.owner:
        return GLColors.brand500;
      case AccountType.manager:
        return GLColors.brand500;
      case AccountType.boarder:
        return Colors.lightBlue.shade700;
      case AccountType.groomer:
        return GLColors.warning500;
      case AccountType.admin:
        return GLColors.brand500;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: 12.borderRadiusA,
        side: BorderSide(color: context.disableColor),
      ),
      elevation: 1,
      color: context.backgroundColor,
      child: Padding(
        padding: [16, 12].edgeInsetsHV,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    (user.name == null || user.name!.isEmpty)
                        ? 'Pending to finish their account'
                        : user.name!,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                if (user.accountType != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _bgColor,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      user.accountType?.toLabel(context.l10n) ?? 'No type',
                      style: TextStyle(
                        color: _fgColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
            GLSpaces.px4,
            Text(
              user.email ?? 'No email',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
            ),
            GLSpaces.px4,
            Text(
              user.phoneNumber ?? 'No phone',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
            ),
            GLSpaces.px4,
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: () async {
                    final res = await AddEditUserDialog.show(
                      context,
                      user: user,
                    );
                    if (res != null) {
                      ref.read(fetchUsersProvider.notifier).updateUser(res);
                    }
                  },
                  style: GLButtonStyles.outlineXS,
                  icon: const Icon(GLIcons.edit, size: 16),
                  label: const Text('Edit'),
                ),
                GLSpaces.px12,
                TextButton.icon(
                  onPressed: () async {
                    final res = await ConfirmDialog.show(
                      context,
                      title: 'Delete User?',
                      description:
                          'Are you sure you want to delete this user? This action cannot be undone. All associated data will be permanently removed.',
                      confirmText: 'Delete',
                    );
                    if (res != null && res) {
                      await ref.read(deleteUserProvider.notifier).delete(user);
                    }
                  },
                  style: GLButtonStyles.errorLinkXS,
                  icon: const Icon(GLIcons.delete, size: 16),
                  label: const Text('Delete'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
