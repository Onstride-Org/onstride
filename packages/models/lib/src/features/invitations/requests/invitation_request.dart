import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'invitation_request.freezed.dart';

part 'invitation_request.g.dart';

/// Represents the data required to generate a barn invitation link.
@freezed
sealed class InvitationRequest with _$InvitationRequest {
  const factory InvitationRequest({
    required String createdById,
    required String barnId,
    required String barnName,
    required AccountType accountType,
    @Default([]) List<PermissionRole> permissions,
  }) = _InvitationRequest;

  factory InvitationRequest.fromJson(Map<String, dynamic> json) =>
      _$InvitationRequestFromJson(json);
}
