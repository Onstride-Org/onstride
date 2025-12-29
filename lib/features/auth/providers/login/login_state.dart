part of 'login_provider.dart';

@freezed
sealed class LoginState with _$LoginState {
  const factory LoginState.initial() = InitialLoginState;

  const factory LoginState.loading() = LoadingLoginState;

  const factory LoginState.success() = SuccessLoginState;

  const factory LoginState.error({required AuthenticationException exception}) =
      ErrorLoginState;
}
