// get_invitation_state.dart
part of 'get_invitation_provider.dart';

/// Represents the state for fetching a single invitation by id.
@freezed
sealed class GetInvitationState with _$GetInvitationState {
  /// Initial idle state before any action is performed.
  const factory GetInvitationState.initial() = InitialGetInvitationState;

  /// Loading state while the invitation is being fetched.
  const factory GetInvitationState.loading() = LoadingGetInvitationState;

  /// Success state when the invitation was found.
  const factory GetInvitationState.success({
    required Invitation invitation,
  }) = SuccessGetInvitationState;

  /// State when the invitation does not exist (null from repository).
  const factory GetInvitationState.notFound() = NotFoundGetInvitationState;

  /// State for authentication-related errors.
  const factory GetInvitationState.authError({
    required AuthenticationException exception,
  }) = AuthErrorGetInvitationState;

  /// State for data/provider-related errors.
  const factory GetInvitationState.dataError({
    required DataProviderException exception,
  }) = DataErrorGetInvitationState;
}
