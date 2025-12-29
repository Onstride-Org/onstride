part of 'send_reset_password_provider.dart';

@freezed
sealed class ResetPasswordState with _$ResetPasswordState {
  const factory ResetPasswordState.initial() = InitialResetPasswordState;

  const factory ResetPasswordState.loading() = LoadingResetPasswordState;

  const factory ResetPasswordState.success() = SuccessResetPasswordState;

  const factory ResetPasswordState.error({
    required AuthenticationException exception,
  }) = ErrorResetPasswordState;
}
