import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'horse_transfer.freezed.dart';
part 'horse_transfer.g.dart';

/// Status of a horse transfer between barns.
enum TransferStatus {
  /// Transfer requested, waiting for approval
  pending,

  /// Transfer approved by receiving barn
  approved,

  /// Transfer rejected
  rejected,

  /// Transfer completed
  completed,

  /// Transfer cancelled by sender
  cancelled,
}

extension TransferStatusX on TransferStatus {
  String get displayName {
    switch (this) {
      case TransferStatus.pending:
        return 'Pending';
      case TransferStatus.approved:
        return 'Approved';
      case TransferStatus.rejected:
        return 'Rejected';
      case TransferStatus.completed:
        return 'Completed';
      case TransferStatus.cancelled:
        return 'Cancelled';
    }
  }

  bool get isFinal =>
      this == TransferStatus.completed ||
      this == TransferStatus.rejected ||
      this == TransferStatus.cancelled;
}

/// Represents a request to transfer a horse from one barn to another.
@freezed
sealed class HorseTransfer with _$HorseTransfer {
  const factory HorseTransfer({
    required String id,

    /// Horse being transferred
    required String horseId,
    required String horseName,

    /// Source barn
    required String fromBarnId,
    required String fromBarnName,

    /// Destination barn
    required String toBarnId,
    required String toBarnName,

    /// User who initiated (requested) the transfer
    required String requestedBy,
    String? requestedByName,

    /// Include horse documents in transfer
    @Default(true) bool includeDocuments,

    /// Include ride logs in transfer
    @Default(true) bool includeRideLogs,

    /// Transfer status
    @Default(TransferStatus.pending) TransferStatus status,

    /// When the transfer was requested
    @TimestampConverter() required DateTime requestedAt,

    /// When the transfer was responded to
    @NullableTimestampConverter() DateTime? respondedAt,

    /// Who responded to the transfer
    String? respondedBy,

    /// When the transfer was completed
    @NullableTimestampConverter() DateTime? completedAt,

    /// Notes/reason for transfer
    String? notes,

    /// Response notes (if rejected or approved with comments)
    String? responseNotes,

    /// Owner of the horse (must approve if different from initiator)
    String? ownerId,
    String? ownerName,

    /// Whether owner has approved
    @Default(false) bool ownerApproved,
  }) = _HorseTransfer;

  factory HorseTransfer.fromJson(Map<String, dynamic> json) =>
      _$HorseTransferFromJson(json);
}
