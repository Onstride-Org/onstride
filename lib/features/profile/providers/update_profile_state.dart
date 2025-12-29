part of 'update_profile_provider.dart';

@freezed
sealed class UpdateProfileState with _$UpdateProfileState {
  const factory UpdateProfileState.initial() = InitialUpdateProfileState;

  const factory UpdateProfileState.loading() = LoadingUpdateProfileState;

  const factory UpdateProfileState.success() = SuccessUpdateProfileState;

  const factory UpdateProfileState.error({
    required DataProviderException exception,
  }) = ErrorUpdateProfileState;
}
