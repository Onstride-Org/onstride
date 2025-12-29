import 'package:app_config_repository/app_config_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'app_state.dart';
part 'app_state_provider.freezed.dart';

final appStateProvider = StateNotifierProvider<AppStateProvider, AppState>((
  ref,
) {
  return AppStateProvider();
});

class AppStateProvider extends StateNotifier<AppState> {
  AppStateProvider() : super(const AppState.init());

  void setUnauthenticated() {
    state = const AppState.unauthenticated();
  }

  void setAuthenticatedUser(GLUser user) {
    state = AppState.authenticated(user: user);
  }

  void setNeedsToFinishRegistration(GLUser user) {
    state = AppState.needsToFinishRegistration(user: user);
  }

  void setDownForMaintenance() {
    state = const AppState.downForMaintenance();
  }

  void setForceUpgradeRequired(ForceUpgrade upgrade) {
    state = AppState.forceUpgradeRequired(forceUpgrade: upgrade);
  }

  void setInit() {
    state = const AppState.init();
  }
}
