import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'offline_sync.freezed.dart';
part 'offline_sync.g.dart';

/// Types of entities that can be synced offline
enum SyncEntityType {
  horse,
  task,
  lesson,
  rideLog,
  invoice,
  document,
  user,
  barn,
}

/// Status of a sync operation
enum SyncOperationType {
  create,
  update,
  delete,
}

/// Status of a pending sync item
enum SyncItemStatus {
  pending,
  syncing,
  completed,
  failed,
  conflict,
}

/// Network connectivity status
enum ConnectivityStatus {
  online,
  offline,
  limited, // Slow or intermittent connection
}

/// A pending sync operation queued for when online
@freezed
sealed class PendingSyncItem with _$PendingSyncItem {
  const factory PendingSyncItem({
    required String id,
    required SyncEntityType entityType,
    required String entityId,
    required SyncOperationType operation,
    required SyncItemStatus status,

    /// The data to sync (JSON encoded)
    required Map<String, dynamic> data,

    /// Priority (lower = higher priority)
    @Default(5) int priority,

    /// Retry tracking
    @Default(0) int retryCount,
    @Default(3) int maxRetries,
    String? lastError,

    /// Timestamps
    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? lastAttemptAt,
    @NullableTimestampConverter() DateTime? completedAt,
  }) = _PendingSyncItem;

  factory PendingSyncItem.fromJson(Map<String, dynamic> json) =>
      _$PendingSyncItemFromJson(json);
}

/// Conflict detected during sync
@freezed
sealed class SyncConflict with _$SyncConflict {
  const factory SyncConflict({
    required String id,
    required SyncEntityType entityType,
    required String entityId,

    /// Local version of the data
    required Map<String, dynamic> localData,
    @TimestampConverter() required DateTime localModifiedAt,

    /// Server version of the data
    required Map<String, dynamic> serverData,
    @TimestampConverter() required DateTime serverModifiedAt,

    /// Resolution
    @Default(ConflictResolution.pending) ConflictResolution resolution,
    String? resolvedBy,
    @NullableTimestampConverter() DateTime? resolvedAt,

    @TimestampConverter() required DateTime createdAt,
  }) = _SyncConflict;

  factory SyncConflict.fromJson(Map<String, dynamic> json) =>
      _$SyncConflictFromJson(json);
}

enum ConflictResolution {
  pending,
  useLocal,
  useServer,
  merged,
  discarded,
}

/// Sync status for the device
@freezed
sealed class DeviceSyncStatus with _$DeviceSyncStatus {
  const factory DeviceSyncStatus({
    required String deviceId,
    required String barnId,
    required ConnectivityStatus connectivity,

    /// Last successful sync
    @NullableTimestampConverter() DateTime? lastFullSyncAt,
    @NullableTimestampConverter() DateTime? lastIncrementalSyncAt,

    /// Pending items count
    @Default(0) int pendingUploads,
    @Default(0) int pendingDownloads,
    @Default(0) int conflictsCount,

    /// Sync progress (0.0 to 1.0)
    @Default(1.0) double syncProgress,
    @Default(false) bool isSyncing,

    /// Storage info
    @Default(0) int localStorageUsedBytes,
    @Default(0) int localStorageLimitBytes,

    @TimestampConverter() required DateTime updatedAt,
  }) = _DeviceSyncStatus;

  factory DeviceSyncStatus.fromJson(Map<String, dynamic> json) =>
      _$DeviceSyncStatusFromJson(json);
}

/// Cache entry for offline data
@freezed
sealed class CachedEntity with _$CachedEntity {
  const factory CachedEntity({
    required String id,
    required SyncEntityType entityType,
    required String entityId,

    /// The cached data
    required Map<String, dynamic> data,

    /// Version tracking
    required int version,
    @TimestampConverter() required DateTime cachedAt,
    @TimestampConverter() required DateTime serverModifiedAt,

    /// Whether this has local modifications
    @Default(false) bool hasLocalChanges,
    @NullableTimestampConverter() DateTime? localModifiedAt,

    /// Expiration
    @NullableTimestampConverter() DateTime? expiresAt,
  }) = _CachedEntity;

  factory CachedEntity.fromJson(Map<String, dynamic> json) =>
      _$CachedEntityFromJson(json);
}
