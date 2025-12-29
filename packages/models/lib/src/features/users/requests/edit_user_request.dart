import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'edit_user_request.freezed.dart';
part 'edit_user_request.g.dart';

@freezed
sealed class EditUserRequest with _$EditUserRequest {
  const factory EditUserRequest({
    required AccountType accountType,
    required List<PermissionRole> permissions,
  }) = _EditUserRequest;

  factory EditUserRequest.fromJson(Map<String, dynamic> json) =>
      _$EditUserRequestFromJson(json);
}
