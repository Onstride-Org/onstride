import 'package:flutter/material.dart';
import 'package:models/models.dart';

/// Card showing platform analytics summary
class PlatformAnalyticsCard extends StatelessWidget {
  const PlatformAnalyticsCard({
    required this.analytics,
    super.key,
  });

  final PlatformAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Platform Overview',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _StatTile(
                    icon: Icons.home_work,
                    label: 'Total Barns',
                    value: analytics.totalBarns.toString(),
                    color: Colors.blue,
                  ),
                ),
                Expanded(
                  child: _StatTile(
                    icon: Icons.people,
                    label: 'Total Users',
                    value: analytics.totalUsers.toString(),
                    color: Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _StatTile(
                    icon: Icons.pets,
                    label: 'Total Horses',
                    value: analytics.totalHorses.toString(),
                    color: Colors.orange,
                  ),
                ),
                Expanded(
                  child: _StatTile(
                    icon: Icons.person_add,
                    label: 'Active Today',
                    value: analytics.activeUsersToday.toString(),
                    color: Colors.purple,
                  ),
                ),
              ],
            ),
            if (analytics.revenueThisMonth != null) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Revenue This Month',
                    style: theme.textTheme.bodyMedium,
                  ),
                  Text(
                    '\$${(analytics.revenueThisMonth! / 100).toStringAsFixed(2)}',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// Card showing subscription breakdown by tier
class SubscriptionBreakdownCard extends StatelessWidget {
  const SubscriptionBreakdownCard({
    required this.analytics,
    super.key,
  });

  final PlatformAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final total = analytics.subscriptionsByTier.values.fold(0, (a, b) => a + b);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Subscriptions',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...analytics.subscriptionsByTier.entries.map((entry) {
              final percentage = total > 0 ? (entry.value / total * 100) : 0.0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          entry.key.toUpperCase(),
                          style: theme.textTheme.labelMedium,
                        ),
                        Text(
                          '${entry.value} (${percentage.toStringAsFixed(1)}%)',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    LinearProgressIndicator(
                      value: percentage / 100,
                      backgroundColor: theme.colorScheme.surfaceContainerHighest,
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

/// Card for a single admin user
class AdminUserCard extends StatelessWidget {
  const AdminUserCard({
    required this.admin,
    this.onEdit,
    this.onRevoke,
    super.key,
  });

  final AdminUser admin;
  final VoidCallback? onEdit;
  final VoidCallback? onRevoke;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getRoleColor(admin.role).withOpacity(0.2),
          child: Icon(
            _getRoleIcon(admin.role),
            color: _getRoleColor(admin.role),
          ),
        ),
        title: Text(admin.name),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(admin.email),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: _getRoleColor(admin.role).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                admin.role.name.toUpperCase(),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: _getRoleColor(admin.role),
                ),
              ),
            ),
          ],
        ),
        trailing: admin.isActive
            ? PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'edit') onEdit?.call();
                  if (value == 'revoke') onRevoke?.call();
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Text('Edit Permissions'),
                  ),
                  const PopupMenuItem(
                    value: 'revoke',
                    child: Text('Revoke Access'),
                  ),
                ],
              )
            : Chip(
                label: const Text('Inactive'),
                backgroundColor: theme.colorScheme.surfaceContainerHighest,
              ),
      ),
    );
  }

  Color _getRoleColor(AdminRole role) {
    switch (role) {
      case AdminRole.superAdmin:
        return Colors.red;
      case AdminRole.admin:
        return Colors.orange;
      case AdminRole.support:
        return Colors.blue;
      case AdminRole.analyst:
        return Colors.purple;
    }
  }

  IconData _getRoleIcon(AdminRole role) {
    switch (role) {
      case AdminRole.superAdmin:
        return Icons.admin_panel_settings;
      case AdminRole.admin:
        return Icons.manage_accounts;
      case AdminRole.support:
        return Icons.support_agent;
      case AdminRole.analyst:
        return Icons.analytics;
    }
  }
}

/// Card for audit log entry
class AuditLogCard extends StatelessWidget {
  const AuditLogCard({
    required this.log,
    super.key,
  });

  final AdminAuditLog log;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _getActionIcon(log.action),
                  size: 18,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    log.action,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Text(
                  _formatDateTime(log.createdAt),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'By: ${log.adminName}',
              style: theme.textTheme.bodySmall,
            ),
            if (log.targetId != null)
              Text(
                'Target: ${log.targetType} (${log.targetId})',
                style: theme.textTheme.bodySmall,
              ),
            if (log.details.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  log.details.entries.map((e) => '${e.key}: ${e.value}').join(', '),
                  style: theme.textTheme.bodySmall,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  IconData _getActionIcon(String action) {
    if (action.contains('create')) return Icons.add_circle;
    if (action.contains('update')) return Icons.edit;
    if (action.contains('delete')) return Icons.delete;
    if (action.contains('login')) return Icons.login;
    return Icons.history;
  }

  String _formatDateTime(DateTime dt) {
    return '${dt.month}/${dt.day} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

/// Card for system announcement
class SystemAnnouncementCard extends StatelessWidget {
  const SystemAnnouncementCard({
    required this.announcement,
    this.onEdit,
    this.onDelete,
    super.key,
  });

  final SystemAnnouncement announcement;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      color: _getTypeColor(announcement.type).withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _getTypeIcon(announcement.type),
                  color: _getTypeColor(announcement.type),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    announcement.title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (onEdit != null)
                  IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: onEdit,
                  ),
                if (onDelete != null)
                  IconButton(
                    icon: const Icon(Icons.delete),
                    onPressed: onDelete,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              announcement.message,
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                if (announcement.isActive)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Active',
                      style: TextStyle(color: Colors.green, fontSize: 12),
                    ),
                  ),
                const Spacer(),
                Text(
                  'Expires: ${_formatDate(announcement.expiresAt)}',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getTypeColor(AnnouncementType type) {
    switch (type) {
      case AnnouncementType.info:
        return Colors.blue;
      case AnnouncementType.warning:
        return Colors.orange;
      case AnnouncementType.critical:
        return Colors.red;
      case AnnouncementType.maintenance:
        return Colors.purple;
      case AnnouncementType.feature:
        return Colors.green;
    }
  }

  IconData _getTypeIcon(AnnouncementType type) {
    switch (type) {
      case AnnouncementType.info:
        return Icons.info;
      case AnnouncementType.warning:
        return Icons.warning;
      case AnnouncementType.critical:
        return Icons.error;
      case AnnouncementType.maintenance:
        return Icons.build;
      case AnnouncementType.feature:
        return Icons.new_releases;
    }
  }

  String _formatDate(DateTime dt) {
    return '${dt.month}/${dt.day}/${dt.year}';
  }
}

/// Card for feature flag
class FeatureFlagCard extends StatelessWidget {
  const FeatureFlagCard({
    required this.flag,
    this.onToggle,
    this.onEdit,
    super.key,
  });

  final FeatureFlag flag;
  final ValueChanged<bool>? onToggle;
  final VoidCallback? onEdit;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: ListTile(
        leading: Icon(
          flag.isEnabled ? Icons.toggle_on : Icons.toggle_off,
          color: flag.isEnabled ? Colors.green : Colors.grey,
          size: 32,
        ),
        title: Text(flag.name),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (flag.description != null)
              Text(
                flag.description!,
                style: theme.textTheme.bodySmall,
              ),
            const SizedBox(height: 4),
            Row(
              children: [
                if (flag.enabledForTiers.isNotEmpty)
                  Text(
                    'Tiers: ${flag.enabledForTiers.join(", ")}',
                    style: theme.textTheme.labelSmall,
                  ),
                if (flag.rolloutPercentage < 100) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${flag.rolloutPercentage}% rollout',
                      style: theme.textTheme.labelSmall,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Switch(
              value: flag.isEnabled,
              onChanged: onToggle,
            ),
            if (onEdit != null)
              IconButton(
                icon: const Icon(Icons.settings),
                onPressed: onEdit,
              ),
          ],
        ),
      ),
    );
  }
}

/// Card for support ticket
class SupportTicketCard extends StatelessWidget {
  const SupportTicketCard({
    required this.ticket,
    this.onTap,
    super.key,
  });

  final SupportTicket ticket;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: _getPriorityColor(ticket.priority).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      ticket.priority.name.toUpperCase(),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: _getPriorityColor(ticket.priority),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusColor(ticket.status).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      ticket.status.name,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: _getStatusColor(ticket.status),
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '#${ticket.id.substring(0, 8)}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                ticket.subject,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                ticket.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.person,
                    size: 14,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    ticket.userName,
                    style: theme.textTheme.bodySmall,
                  ),
                  const Spacer(),
                  Text(
                    _formatDateTime(ticket.createdAt),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getPriorityColor(TicketPriority priority) {
    switch (priority) {
      case TicketPriority.low:
        return Colors.grey;
      case TicketPriority.medium:
        return Colors.blue;
      case TicketPriority.high:
        return Colors.orange;
      case TicketPriority.urgent:
        return Colors.red;
    }
  }

  Color _getStatusColor(TicketStatus status) {
    switch (status) {
      case TicketStatus.open:
        return Colors.blue;
      case TicketStatus.inProgress:
        return Colors.orange;
      case TicketStatus.waitingOnUser:
        return Colors.purple;
      case TicketStatus.resolved:
        return Colors.green;
      case TicketStatus.closed:
        return Colors.grey;
    }
  }

  String _formatDateTime(DateTime dt) {
    return '${dt.month}/${dt.day} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
