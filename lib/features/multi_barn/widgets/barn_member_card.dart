import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:models/models.dart';

/// A card widget that displays information about a barn member.
class BarnMemberCard extends StatelessWidget {
  const BarnMemberCard({
    required this.member,
    this.onTap,
    this.onRemove,
    this.showRemoveButton = false,
    super.key,
  });

  final UserBarnRole member;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;
  final bool showRemoveButton;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: _getRoleColor(member.role).withOpacity(0.2),
                child: Text(
                  member.userName?.isNotEmpty == true
                      ? member.userName![0].toUpperCase()
                      : 'U',
                  style: TextStyle(
                    color: _getRoleColor(member.role),
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ),
              GLSpaces.px16,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      member.userName ?? 'Unknown User',
                      style: context.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    GLSpaces.px4,
                    Row(
                      children: [
                        _RoleChip(role: member.role),
                        if (member.title != null) ...[
                          GLSpaces.px8,
                          Text(
                            member.title!,
                            style: context.bodySmall.copyWith(
                              color: GLColors.neutral500,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              if (member.isPrimary)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: GLColors.success100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Primary',
                    style: context.bodySmall.copyWith(
                      color: GLColors.success700,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              if (showRemoveButton && onRemove != null) ...[
                GLSpaces.px8,
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  color: GLColors.error500,
                  onPressed: onRemove,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getRoleColor(BarnRole role) {
    switch (role) {
      case BarnRole.owner:
        return GLColors.brand800;
      case BarnRole.admin:
        return GLColors.brand600;
      case BarnRole.manager:
        return GLColors.brand500;
      case BarnRole.trainer:
        return Colors.purple;
      case BarnRole.groomer:
        return Colors.teal;
      case BarnRole.boarder:
        return Colors.orange;
      case BarnRole.vendor:
        return Colors.blue;
    }
  }
}

class _RoleChip extends StatelessWidget {
  const _RoleChip({required this.role});

  final BarnRole role;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _getBackgroundColor(role),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _getRoleName(role),
        style: context.bodySmall.copyWith(
          color: _getTextColor(role),
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  String _getRoleName(BarnRole role) {
    switch (role) {
      case BarnRole.owner:
        return 'Owner';
      case BarnRole.admin:
        return 'Admin';
      case BarnRole.manager:
        return 'Manager';
      case BarnRole.groomer:
        return 'Groomer';
      case BarnRole.boarder:
        return 'Boarder';
      case BarnRole.trainer:
        return 'Trainer';
      case BarnRole.vendor:
        return 'Vendor';
    }
  }

  Color _getBackgroundColor(BarnRole role) {
    switch (role) {
      case BarnRole.owner:
        return GLColors.brand100;
      case BarnRole.admin:
        return GLColors.brand50;
      case BarnRole.manager:
        return Colors.purple.withOpacity(0.1);
      case BarnRole.trainer:
        return Colors.indigo.withOpacity(0.1);
      case BarnRole.groomer:
        return Colors.teal.withOpacity(0.1);
      case BarnRole.boarder:
        return Colors.orange.withOpacity(0.1);
      case BarnRole.vendor:
        return Colors.blue.withOpacity(0.1);
    }
  }

  Color _getTextColor(BarnRole role) {
    switch (role) {
      case BarnRole.owner:
        return GLColors.brand800;
      case BarnRole.admin:
        return GLColors.brand700;
      case BarnRole.manager:
        return Colors.purple.shade700;
      case BarnRole.trainer:
        return Colors.indigo.shade700;
      case BarnRole.groomer:
        return Colors.teal.shade700;
      case BarnRole.boarder:
        return Colors.orange.shade700;
      case BarnRole.vendor:
        return Colors.blue.shade700;
    }
  }
}
