import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'create_account_request.freezed.dart';
part 'create_account_request.g.dart';

@freezed
sealed class CreateAccountRequest with _$CreateAccountRequest {
  const factory CreateAccountRequest({
    required String name,
    required String email,
    required String phoneNumber,
    required AccountType accountType,
    required String? barnId,
    @JsonKey(includeToJson: false) required String password,
    @Default([]) List<PermissionRole> permissions,
    @Default(RegistrationMethod.email) RegistrationMethod registrationMethod,
  }) = _CreateAccountRequest;

  factory CreateAccountRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateAccountRequestFromJson(json);
}
