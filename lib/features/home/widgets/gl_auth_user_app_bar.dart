import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class GLAuthUserAppBar extends ConsumerWidget implements PreferredSizeWidget {
  const GLAuthUserAppBar({
    super.key,
    this.title,
    this.leading,
    this.actions = const [],
  });

  final Widget? title;
  final Widget? leading;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(accountProvider).currentUser;
    final name = user.name ?? '';
    return AppBar(
      leadingWidth: 98,
      leading:
          leading ??
          Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 10,
            ).copyWith(left: 30),
            child: Assets.images.textLogo.image(color: context.primaryColor),
          ),
      title: title,
      actions: actions.isNotEmpty
          ? actions
          : [
              Padding(
                padding: [0, 10, 24, 10].edgeInsetsLTRB,
                child: GLPopupMenuButton<int>(
                  itemHeight: 28,
                  items: [
                    GLPopupItem(
                      onTap: () => context.goNamed(ProfileScreen.name),
                      height: 40,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            name,
                            style: context.bodyMedium,
                          ),
                          GLSpaces.px4,
                          Text(
                            user.email ?? '',
                            style: const TextStyle(
                              color: GLColors.neutral500,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (user.canManageUsers)
                      GLPopupItem(
                        onTap: () => context.goNamed(UsersScreen.name),
                        child: const Row(
                          children: [
                            Icon(GLIcons.useroutline),
                            GLSpaces.px8,
                            Text('Users'),
                          ],
                        ),
                      ),
                    if (user.isBoarder)
                      GLPopupItem(
                        onTap: () {
                          context.goNamed(
                            InvoicesScreen.name,
                            pathParameters: {'boarderId': user.id},
                          );
                        },
                        child: Row(
                          children: [
                            const Icon(GLIcons.invoice),
                            GLSpaces.px8,
                            Text(context.l10n.invoicesTitle),
                          ],
                        ),
                      ),
                    GLPopupItem(
                      onTap: () async {
                        showLoadingDialog(context);
                        await ref
                            .read(pushNotificationsServiceProvider)
                            .setFCMTokenToNull();
                        await ref.read(authRepositoryProvider).logOut();
                        ref.read(fetchUsersProvider.notifier).reset();
                        ref.read(fetchHorsesProvider.notifier).reset();
                        ref.read(barnSetupControllerProvider.notifier).reset();
                        ref.read(fetchInvoicesProvider.notifier).reset();
                      },
                      child: const Row(
                        children: [
                          Icon(GLIcons.log_out),
                          GLSpaces.px8,
                          Text('Sign out'),
                        ],
                      ),
                    ),
                  ],
                  child: CircleAvatar(
                    backgroundColor: GLColors.brand800,
                    child: Text(
                      user.initials,
                      style: context.bodyMedium.copyWith(
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ],
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight.h);
}
