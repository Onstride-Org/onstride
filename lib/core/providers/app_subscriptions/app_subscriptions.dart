import 'dart:async';

import 'package:app_config_repository/app_config_repository.dart';
import 'package:auth_repository/auth_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_subscriptions.g.dart';

@Riverpod(keepAlive: true)
void appInitializer(Ref ref) {
  final subs = _AppSubscriptions(
    ref.read(authRepositoryProvider),
    ref.read(appConfigRepositoryProvider),
    ref.read(appStateProvider.notifier),
    ref.read(accountProvider.notifier),
  )..init();
  ref.onDispose(subs.dispose);
}

class _AppSubscriptions {
  _AppSubscriptions(
    this._authRepository,
    this._appConfigRepository,
    this._appState,
    this._accountProvider,
  );

  final AuthRepository _authRepository;
  final AppConfigRepository _appConfigRepository;
  final AppStateProvider _appState;
  final Account _accountProvider;

  late final StreamSubscription<GLUser?> _userSubscription;
  late final StreamSubscription<ForceUpgrade> _forceUpgradeSubscription;
  late final StreamSubscription<bool> _isDownForMaintenanceSubscription;

  void init() {
    _userSubscription = _authRepository.user.listen(_onGLUserChanged);
    _forceUpgradeSubscription = _appConfigRepository
        .isForceUpgradeRequired()
        .listen(_onForceUpgradeChanged);
    _isDownForMaintenanceSubscription = _appConfigRepository
        .isDownForMaintenance()
        .listen(_onMaintenanceChanged);
  }

  void _onGLUserChanged(GLUser? user) {
    if (user == null || user.id.isEmpty) {
      _appState.setUnauthenticated();
    } else {
      _accountProvider.loadUser(user.id);
      _appState.setAuthenticatedUser(user);
    }
  }

  void _onForceUpgradeChanged(ForceUpgrade upgrade) {
    if (upgrade.isUpgradeRequired) {
      _appState.setForceUpgradeRequired(upgrade);
    }
  }

  void _onMaintenanceChanged(bool isDown) {
    if (isDown) {
      _appState.setDownForMaintenance();
    }
  }

  void dispose() {
    _userSubscription.cancel();
    _forceUpgradeSubscription.cancel();
    _isDownForMaintenanceSubscription.cancel();
  }
}
