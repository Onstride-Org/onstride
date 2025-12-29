part of 'create_account_provider.dart';

@freezed
sealed class CreateAccountState with _$CreateAccountState {
  const factory CreateAccountState.initial() = InitialCreateAccountState;

  const factory CreateAccountState.loading() = LoadingCreateAccountState;

  const factory CreateAccountState.success({required GLUser user}) =
      SuccessCreateAccountState;

  const factory CreateAccountState.error({
    required AuthenticationException exception,
  }) = ErrorCreateAccountState;
}
