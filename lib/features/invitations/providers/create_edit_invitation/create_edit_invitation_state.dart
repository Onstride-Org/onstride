part of 'create_edit_invitation_provider.dart';

@freezed
sealed class CreateEditInvitationState with _$CreateEditInvitationState {
  const factory CreateEditInvitationState.initial() =
      InitialCreateEditInvitationState;

  const factory CreateEditInvitationState.loading() =
      LoadingCreateEditInvitationState;

  const factory CreateEditInvitationState.success({
    required Invitation invitation,
  }) = SuccessCreateEditInvitationState;

  const factory CreateEditInvitationState.authError({
    required AuthenticationException exception,
  }) = AuthErrorCreateEditInvitationState;

  const factory CreateEditInvitationState.dataError({
    required DataProviderException exception,
  }) = DataErrorCreateEditInvitationState;
}
