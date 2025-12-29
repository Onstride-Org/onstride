import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/multi_barn/providers/providers.dart';
import 'package:gl_horses/features/multi_barn/widgets/widgets.dart';
import 'package:models/models.dart';

class BarnMembersScreen extends ConsumerStatefulWidget {
  const BarnMembersScreen({required this.barnId, super.key});

  static const name = 'barn-members';
  static const path = '/barns/:barnId/members';

  final String barnId;

  @override
  ConsumerState<BarnMembersScreen> createState() => _BarnMembersScreenState();
}

class _BarnMembersScreenState extends ConsumerState<BarnMembersScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(fetchBarnMembersProvider.notifier).fetch(barnId: widget.barnId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(fetchBarnMembersProvider);
    final user = ref.watch(accountProvider).currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Barn Members'),
        actions: [
          if (user.canManageUsers)
            IconButton(
              icon: const Icon(Icons.person_add_outlined),
              onPressed: () => _showAddMemberDialog(context),
            ),
        ],
      ),
      body: state.when(
        initial: () => const Center(child: CircularProgressIndicator()),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (message) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: GLColors.error500),
              GLSpaces.px16,
              Text(message),
              GLSpaces.px16,
              ElevatedButton(
                onPressed: () => ref
                    .read(fetchBarnMembersProvider.notifier)
                    .fetch(barnId: widget.barnId),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        success: (members) {
          if (members.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.people_outline, size: 64, color: GLColors.neutral300),
                  GLSpaces.px16,
                  Text('No members found'),
                ],
              ),
            );
          }

          // Group members by role
          final groupedMembers = <BarnRole, List<UserBarnRole>>{};
          for (final member in members) {
            groupedMembers.putIfAbsent(member.role, () => []).add(member);
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 16),
            itemCount: groupedMembers.length,
            itemBuilder: (context, index) {
              final role = groupedMembers.keys.elementAt(index);
              final roleMembers = groupedMembers[role]!;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 8,
                    ),
                    child: Text(
                      _getRoleSectionTitle(role, roleMembers.length),
                      style: context.bodyMedium.copyWith(
                        color: GLColors.neutral500,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  ...roleMembers.map(
                    (member) => BarnMemberCard(
                      member: member,
                      showRemoveButton: user.canManageUsers &&
                          member.userId != user.id,
                      onRemove: () => _confirmRemoveMember(context, member),
                    ),
                  ),
                  GLSpaces.px16,
                ],
              );
            },
          );
        },
      ),
    );
  }

  String _getRoleSectionTitle(BarnRole role, int count) {
    final roleName = switch (role) {
      BarnRole.owner => 'Owners',
      BarnRole.admin => 'Admins',
      BarnRole.manager => 'Managers',
      BarnRole.trainer => 'Trainers',
      BarnRole.groomer => 'Groomers',
      BarnRole.boarder => 'Boarders',
      BarnRole.vendor => 'Vendors',
    };
    return '$roleName ($count)';
  }

  Future<void> _showAddMemberDialog(BuildContext context) async {
    // TODO: Implement add member dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Add member functionality coming soon'),
      ),
    );
  }

  Future<void> _confirmRemoveMember(
    BuildContext context,
    UserBarnRole member,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Member'),
        content: Text(
          'Are you sure you want to remove ${member.userName ?? 'this user'} from the barn?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: GLColors.error600),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final user = ref.read(accountProvider).currentUser;
      await ref.read(fetchBarnMembersProvider.notifier).removeMember(
            userId: member.userId,
            barnId: widget.barnId,
            removedBy: user.id,
          );
    }
  }
}
