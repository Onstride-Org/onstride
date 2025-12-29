import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/invitations/dialogs/add_invitation_dialog.dart';
import 'package:gl_horses/features/users/widgets/widgets.dart';
import 'package:go_router/go_router.dart';

class UsersScreen extends ConsumerStatefulWidget {
  const UsersScreen({super.key});

  static String path = 'users';
  static String name = 'users';

  @override
  ConsumerState<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends ConsumerState<UsersScreen> {
  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback(
      (_) {
        ref.read(fetchUsersProvider.notifier).fetchUsers();
      },
    );
    super.initState();
  }

  void _deleteListener(DeleteUserState? previous, DeleteUserState next) {
    switch (next) {
      case InitialDeleteUserState():
      case LoadingDeleteUserState():
        return showInvisibleLoadingDialog(context);
      case SuccessDeleteUserState():
        context.pop();
        ref.read(fetchUsersProvider.notifier).remove(next.user);
        return context.showSuccess(title: 'User deleted successfully');
      case AuthErrorDeleteUserState():
        context.pop();
        return context.showAuthException(next.exception);
      case DataErrorDeleteUserState():
        context.pop();
        return context.showDataException(next.exception);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(fetchUsersProvider);

    ref.listen(deleteUserProvider, _deleteListener);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Users'),
        actions: [
          // IconButton(
          //   icon: const Icon(Icons.share),
          //   style: IconButton.styleFrom(
          //     fixedSize: Size.fromHeight(28.h),
          //   ),
          //   onPressed: () async {
          //     final user = await AddEditInvitationDialog.show(context);
          //     // if (user != null) {
          //     //   ref.read(fetchUsersProvider.notifier).add(user);
          //     // }
          //   },
          // ),
          Padding(
            padding: 12.edgeInsetsR,
            child: IconButton(
              icon: const Icon(GLIcons.add),
              color: context.backgroundColor,
              style: IconButton.styleFrom(
                backgroundColor: context.primaryColor,
                fixedSize: Size.fromHeight(28.h),
              ),
              onPressed: () => AddEditInvitationDialog.show(context),
            ),
          ),
        ],
      ),
      body: switch (state.status) {
        RequestStatus.loading => const Center(
          child: GLBouncingDotsIndicator(),
        ),
        RequestStatus.error => Center(child: Text('Error: ${state.exception}')),
        _ =>
          state.allUsers.isEmpty
              ? NotResultsWidget.data(
                  title: 'There are no users associated with you',
                  description: 'Start creating some',
                  alignment: const Alignment(0, -.3),
                )
              : RefreshIndicator(
                  onRefresh: () async {
                    await ref
                        .read(fetchUsersProvider.notifier)
                        .fetchUsers(reload: true);
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.allUsers.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (_, index) {
                      final user = state.allUsers[index];
                      return UserCard(user: user);
                    },
                  ),
                ),
      },
    );
  }
}
