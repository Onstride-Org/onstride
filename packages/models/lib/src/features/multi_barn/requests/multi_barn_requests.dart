import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'multi_barn_requests.freezed.dart';
part 'multi_barn_requests.g.dart';

/// Payload for adding a user to a barn.
@freezed
sealed class AddUserToBarnPayload with _$AddUserToBarnPayload {
  const factory AddUserToBarnPayload({
    required String userId,
    required String barnId,
    required BarnRole role,
    @Default(<PermissionRole>[]) List<PermissionRole> permissions,
    required String invitedBy,
    String? title,
    String? notes,
    @Default(false) bool isPrimary,
  }) = _AddUserToBarnPayload;

  factory AddUserToBarnPayload.fromJson(Map<String, dynamic> json) =>
      _$AddUserToBarnPayloadFromJson(json);
}

/// Payload for updating a user's role in a barn.
@freezed
sealed class UpdateBarnRolePayload with _$UpdateBarnRolePayload {
  const factory UpdateBarnRolePayload({
    required String userBarnRoleId,
    required String barnId,
    BarnRole? role,
    List<PermissionRole>? permissions,
    MembershipStatus? status,
    String? title,
    String? notes,
    bool? isPrimary,
  }) = _UpdateBarnRolePayload;

  factory UpdateBarnRolePayload.fromJson(Map<String, dynamic> json) =>
      _$UpdateBarnRolePayloadFromJson(json);
}

/// Payload for switching the active barn context.
@freezed
sealed class SwitchBarnPayload with _$SwitchBarnPayload {
  const factory SwitchBarnPayload({
    required String userId,
    required String barnId,
  }) = _SwitchBarnPayload;

  factory SwitchBarnPayload.fromJson(Map<String, dynamic> json) =>
      _$SwitchBarnPayloadFromJson(json);
}

/// Payload for initiating a horse transfer.
@freezed
sealed class InitiateTransferPayload with _$InitiateTransferPayload {
  const factory InitiateTransferPayload({
    required String horseId,
    required String horseName,
    required String fromBarnId,
    required String fromBarnName,
    required String toBarnId,
    required String toBarnName,
    required String requestedBy,
    String? notes,
    @Default(true) bool includeDocuments,
    @Default(true) bool includeRideLogs,
  }) = _InitiateTransferPayload;

  factory InitiateTransferPayload.fromJson(Map<String, dynamic> json) =>
      _$InitiateTransferPayloadFromJson(json);
}

/// Payload for responding to a horse transfer.
@freezed
sealed class RespondToTransferPayload with _$RespondToTransferPayload {
  const factory RespondToTransferPayload({
    required String transferId,
    required bool approved,
    required String respondedBy,
    String? responseNotes,
  }) = _RespondToTransferPayload;

  factory RespondToTransferPayload.fromJson(Map<String, dynamic> json) =>
      _$RespondToTransferPayloadFromJson(json);
}
