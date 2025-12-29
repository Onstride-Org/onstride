part of 'app_state_provider.dart';

@freezed
sealed class AppState with _$AppState {
  const factory AppState.init() = InitAppState;

  const factory AppState.unauthenticated() = UnauthenticatedAppState;

  const factory AppState.authenticated({required GLUser user}) =
      AuthenticatedAppState;

  const factory AppState.needsToFinishRegistration({
    required GLUser? user,
  }) = NeedsToFinishRegistrationAppState;

  const factory AppState.downForMaintenance({
    @Default(ForceUpgrade(isUpgradeRequired: false)) ForceUpgrade forceUpgrade,
  }) = DownForMaintenance;

  const factory AppState.forceUpgradeRequired({
    required ForceUpgrade forceUpgrade,
  }) = ForceUpgradeRequired;
}
