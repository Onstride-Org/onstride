import 'package:auth_repository/auth_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/common/common.dart';
import 'package:gl_horses/core/config/config.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'load_credentials_provider.freezed.dart';
part 'load_credentials_provider.g.dart';
part 'load_credentials_state.dart';

@riverpod
class LoadCredentials extends _$LoadCredentials with ProviderGuardMixin {
  AuthRepository get _repository => ref.read(authRepositoryProvider);

  Future<void> readCredentials() async {
    await guard<GlAuthCredentials?>(
      onStart: () => state = const LoadCredentialsState.loading(),
      action: () => _repository.readCredentials(),
      onSuccess: (data) => state = SuccessLoadCredentialsState(
        credentials: data,
        rememberMe: data != null,
      ),
      onException: (e) => state = LoadCredentialsState.error(exception: e),
    );
  }

  Future<void> saveCredentials({
    required String email,
    required String password,
  }) async {
    if (!state.rememberMe) {
      await clear();
      return;
    }
    await guard<void>(
      onStart: () => state = const LoadCredentialsState.loading(),
      action: () =>
          _repository.saveCredentials(username: email, password: password),
      onSuccess: (data) => state = SuccessLoadCredentialsState(
        credentials: GlAuthCredentials(email: email, password: password),
        rememberMe: true,
      ),
      onException: (e) => state = LoadCredentialsState.error(exception: e),
    );
  }

  void switchRememberMe() {
    state = state.copyWith(rememberMe: !state.rememberMe);
  }

  Future<void> clear() async {
    await _repository.clearCredentials();
  }

  @override
  LoadCredentialsState build() => const LoadCredentialsState.initial();
}
