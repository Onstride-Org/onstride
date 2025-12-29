part of 'delete_user_provider.dart';

@freezed
sealed class DeleteUserState with _$DeleteUserState {
  const factory DeleteUserState.initial() = InitialDeleteUserState;

  const factory DeleteUserState.loading() = LoadingDeleteUserState;

  const factory DeleteUserState.success({required GLUser user}) =
      SuccessDeleteUserState;

  const factory DeleteUserState.authError({
    required AuthenticationException exception,
  }) = AuthErrorDeleteUserState;

  const factory DeleteUserState.dataError({
    required DataProviderException exception,
  }) = DataErrorDeleteUserState;
}
