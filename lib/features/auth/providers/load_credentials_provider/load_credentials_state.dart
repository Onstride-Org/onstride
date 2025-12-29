part of 'load_credentials_provider.dart';

@freezed
sealed class LoadCredentialsState with _$LoadCredentialsState {
  const factory LoadCredentialsState.initial({
    @Default(false) bool rememberMe,
  }) = InitialLoadCredentialsState;

  const factory LoadCredentialsState.loading({
    @Default(false) bool rememberMe,
  }) = LoadingLoadCredentialsState;

  const factory LoadCredentialsState.success({
    required bool rememberMe,
    GlAuthCredentials? credentials,
  }) = SuccessLoadCredentialsState;

  const factory LoadCredentialsState.error({
    @Default(false) bool rememberMe,
    required DataProviderException exception,
  }) = ErrorLoadCredentialsState;
}
