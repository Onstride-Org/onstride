import 'package:freezed_annotation/freezed_annotation.dart';

part 'gl_auth_credentials.freezed.dart';
part 'gl_auth_credentials.g.dart';

@freezed
sealed class GlAuthCredentials with _$GlAuthCredentials {
  const factory GlAuthCredentials({
    required String email,
    required String password,
  }) = _GlAuthCredentials;

  factory GlAuthCredentials.fromJson(Map<String, dynamic> json) =>
      _$GlAuthCredentialsFromJson(json);
}
