part of 'create_edit_user_provider.dart';

@freezed
sealed class CreateEditUserState with _$CreateEditUserState {
  const factory CreateEditUserState.initial() = InitialCreateEditUserState;

  const factory CreateEditUserState.loading() = LoadingCreateEditUserState;

  const factory CreateEditUserState.success({required GLUser user}) =
      SuccessCreateEditUserState;

  const factory CreateEditUserState.authError({
    required AuthenticationException exception,
  }) = AuthErrorCreateEditUserState;

  const factory CreateEditUserState.dataError({
    required DataProviderException exception,
  }) = DataErrorCreateEditUserState;
}
