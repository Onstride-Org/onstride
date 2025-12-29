import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'invitation.freezed.dart';
part 'invitation.g.dart';

@freezed
sealed class Invitation with _$Invitation {
  const factory Invitation({
    required String id,
    required String barnId,
    required String barnName,
    required AccountType accountType,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime expiresAt,
    @Default([]) List<PermissionRole> permissions,
    @Default(true) bool active,
  }) = _Invitation;

  factory Invitation.fromJson(Map<String, dynamic> json) =>
      _$InvitationFromJson(json);
}
