import 'package:flutter/material.dart';
import 'package:models/models.dart';

import '../services/offline_sync_service.dart';

/// Banner showing offline status
class OfflineStatusBanner extends StatelessWidget {
  const OfflineStatusBanner({
    required this.syncService,
    super.key,
  });

  final OfflineSyncService syncService;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: syncService,
      builder: (context, _) {
        if (syncService.isOnline && !syncService.hasOfflineChanges) {
          return const SizedBox.shrink();
        }

        return MaterialBanner(
          backgroundColor: syncService.isOnline
              ? Colors.blue.shade100
              : Colors.orange.shade100,
          leading: Icon(
            syncService.isOnline ? Icons.sync : Icons.cloud_off,
            color: syncService.isOnline ? Colors.blue : Colors.orange,
          ),
          content: Text(
            syncService.isOnline
                ? 'Syncing ${syncService.pendingCount} changes...'
                : 'You\'re offline. Changes will sync when connected.',
          ),
          actions: [
            if (syncService.isOnline && !syncService.isSyncing)
              TextButton(
                onPressed: () => syncService.syncPendingItems(),
                child: const Text('Sync Now'),
              ),
          ],
        );
      },
    );
  }
}

/// Small indicator for app bar
class OfflineIndicator extends StatelessWidget {
  const OfflineIndicator({
    required this.syncService,
    super.key,
  });

  final OfflineSyncService syncService;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: syncService,
      builder: (context, _) {
        if (syncService.isOnline && !syncService.hasOfflineChanges) {
          return const SizedBox.shrink();
        }

        return Tooltip(
          message: syncService.isOnline
              ? '${syncService.pendingCount} changes pending'
              : 'Offline mode',
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: syncService.isOnline
                  ? Colors.blue.withOpacity(0.2)
                  : Colors.orange.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (syncService.isSyncing)
                  const SizedBox(
                    width: 12,
                    height: 12,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else
                  Icon(
                    syncService.isOnline ? Icons.sync : Icons.cloud_off,
                    size: 16,
                    color: syncService.isOnline ? Colors.blue : Colors.orange,
                  ),
                const SizedBox(width: 4),
                Text(
                  syncService.isOnline
                      ? '${syncService.pendingCount}'
                      : 'Offline',
                  style: TextStyle(
                    fontSize: 12,
                    color: syncService.isOnline ? Colors.blue : Colors.orange,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Card showing pending sync items
class PendingSyncCard extends StatelessWidget {
  const PendingSyncCard({
    required this.item,
    this.onRetry,
    this.onDiscard,
    super.key,
  });

  final PendingSyncItem item;
  final VoidCallback? onRetry;
  final VoidCallback? onDiscard;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: ListTile(
        leading: _buildStatusIcon(context),
        title: Text(
          '${item.operation.name.toUpperCase()} ${item.entityType.name}',
          style: theme.textTheme.titleSmall,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ID: ${item.entityId}',
              style: theme.textTheme.bodySmall,
            ),
            if (item.lastError != null)
              Text(
                item.lastError!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.error,
                ),
              ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (item.status == SyncItemStatus.failed && onRetry != null)
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: onRetry,
              ),
            if (onDiscard != null)
              IconButton(
                icon: const Icon(Icons.delete_outline),
                onPressed: onDiscard,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusIcon(BuildContext context) {
    switch (item.status) {
      case SyncItemStatus.pending:
        return const Icon(Icons.schedule, color: Colors.grey);
      case SyncItemStatus.syncing:
        return const SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(strokeWidth: 2),
        );
      case SyncItemStatus.failed:
        return Icon(Icons.error_outline, color: Colors.red.shade400);
      case SyncItemStatus.completed:
        return Icon(Icons.check_circle, color: Colors.green.shade400);
    }
  }
}

/// Card showing sync conflict
class SyncConflictCard extends StatelessWidget {
  const SyncConflictCard({
    required this.conflict,
    this.onUseLocal,
    this.onUseServer,
    super.key,
  });

  final SyncConflict conflict;
  final VoidCallback? onUseLocal;
  final VoidCallback? onUseServer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      color: theme.colorScheme.errorContainer.withOpacity(0.3),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.warning_amber,
                  color: theme.colorScheme.error,
                ),
                const SizedBox(width: 8),
                Text(
                  'Sync Conflict',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.error,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '${conflict.entityType.name} (${conflict.entityId})',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Local Version',
                        style: theme.textTheme.labelSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        _formatDateTime(conflict.localModifiedAt),
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Server Version',
                        style: theme.textTheme.labelSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        _formatDateTime(conflict.serverModifiedAt),
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton(
                  onPressed: onUseServer,
                  child: const Text('Use Server'),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: onUseLocal,
                  child: const Text('Use Local'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dt) {
    return '${dt.month}/${dt.day} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
