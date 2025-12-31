import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:models/models.dart';

/// Service for managing offline data sync.
class OfflineSyncService extends ChangeNotifier {
  OfflineSyncService();

  ConnectivityStatus _connectivity = ConnectivityStatus.online;
  bool _isSyncing = false;
  final List<PendingSyncItem> _pendingItems = [];
  final List<SyncConflict> _conflicts = [];
  DateTime? _lastSyncAt;

  ConnectivityStatus get connectivity => _connectivity;
  bool get isSyncing => _isSyncing;
  bool get isOnline => _connectivity == ConnectivityStatus.online;
  bool get hasOfflineChanges => _pendingItems.isNotEmpty;
  int get pendingCount => _pendingItems.length;
  int get conflictCount => _conflicts.length;
  DateTime? get lastSyncAt => _lastSyncAt;
  List<PendingSyncItem> get pendingItems => List.unmodifiable(_pendingItems);
  List<SyncConflict> get conflicts => List.unmodifiable(_conflicts);

  /// Updates connectivity status
  void updateConnectivity(ConnectivityStatus status) {
    if (_connectivity != status) {
      _connectivity = status;
      notifyListeners();

      // Auto-sync when coming back online
      if (status == ConnectivityStatus.online && _pendingItems.isNotEmpty) {
        syncPendingItems();
      }
    }
  }

  /// Queues an item for sync when online
  void queueForSync({
    required SyncEntityType entityType,
    required String entityId,
    required SyncOperationType operation,
    required Map<String, dynamic> data,
    int priority = 5,
  }) {
    final item = PendingSyncItem(
      id: '${entityType.name}_${entityId}_${DateTime.now().millisecondsSinceEpoch}',
      entityType: entityType,
      entityId: entityId,
      operation: operation,
      status: SyncItemStatus.pending,
      data: data,
      priority: priority,
      createdAt: DateTime.now(),
    );

    _pendingItems.add(item);
    _pendingItems.sort((a, b) => a.priority.compareTo(b.priority));
    notifyListeners();

    // If online, sync immediately
    if (isOnline) {
      syncPendingItems();
    }
  }

  /// Syncs all pending items
  Future<void> syncPendingItems() async {
    if (_isSyncing || _pendingItems.isEmpty || !isOnline) return;

    _isSyncing = true;
    notifyListeners();

    try {
      final itemsToSync = List<PendingSyncItem>.from(_pendingItems);

      for (final item in itemsToSync) {
        try {
          // Update status to syncing
          final index = _pendingItems.indexOf(item);
          if (index != -1) {
            _pendingItems[index] = item.copyWith(
              status: SyncItemStatus.syncing,
              lastAttemptAt: DateTime.now(),
            );
            notifyListeners();
          }

          // Simulate sync (in real implementation, this would call the API)
          await _syncItem(item);

          // Remove from pending on success
          _pendingItems.removeWhere((i) => i.id == item.id);
          notifyListeners();
        } catch (e) {
          // Handle sync failure
          final index = _pendingItems.indexWhere((i) => i.id == item.id);
          if (index != -1) {
            final updatedItem = _pendingItems[index].copyWith(
              status: SyncItemStatus.failed,
              retryCount: _pendingItems[index].retryCount + 1,
              lastError: e.toString(),
              lastAttemptAt: DateTime.now(),
            );

            if (updatedItem.retryCount >= updatedItem.maxRetries) {
              // Move to conflicts if max retries exceeded
              _conflicts.add(SyncConflict(
                id: 'conflict_${item.id}',
                entityType: item.entityType,
                entityId: item.entityId,
                localData: item.data,
                localModifiedAt: item.createdAt,
                serverData: {}, // Would be populated from server
                serverModifiedAt: DateTime.now(),
                createdAt: DateTime.now(),
              ));
              _pendingItems.removeAt(index);
            } else {
              _pendingItems[index] = updatedItem;
            }
            notifyListeners();
          }
        }
      }

      _lastSyncAt = DateTime.now();
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
  }

  Future<void> _syncItem(PendingSyncItem item) async {
    // In real implementation, this would:
    // 1. Send data to server based on operation type
    // 2. Handle conflicts if server version is newer
    // 3. Return success/failure

    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 100));
  }

  /// Resolves a sync conflict
  void resolveConflict(String conflictId, ConflictResolution resolution) {
    final index = _conflicts.indexWhere((c) => c.id == conflictId);
    if (index != -1) {
      _conflicts[index] = _conflicts[index].copyWith(
        resolution: resolution,
        resolvedAt: DateTime.now(),
      );

      if (resolution == ConflictResolution.useLocal) {
        // Re-queue for sync with local data
        final conflict = _conflicts[index];
        queueForSync(
          entityType: conflict.entityType,
          entityId: conflict.entityId,
          operation: SyncOperationType.update,
          data: conflict.localData,
          priority: 1, // High priority
        );
      }

      _conflicts.removeAt(index);
      notifyListeners();
    }
  }

  /// Clears all pending items and conflicts
  void clearAll() {
    _pendingItems.clear();
    _conflicts.clear();
    notifyListeners();
  }

  /// Gets sync status for display
  DeviceSyncStatus getDeviceSyncStatus(String deviceId, String barnId) {
    return DeviceSyncStatus(
      deviceId: deviceId,
      barnId: barnId,
      connectivity: _connectivity,
      lastFullSyncAt: _lastSyncAt,
      pendingUploads: _pendingItems.length,
      conflictsCount: _conflicts.length,
      isSyncing: _isSyncing,
      updatedAt: DateTime.now(),
    );
  }
}
