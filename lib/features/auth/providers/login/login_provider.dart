import 'package:auth_repository/auth_repository.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'login_provider.freezed.dart';
part 'login_provider.g.dart';
part 'login_state.dart';

@riverpod
class Login extends _$Login {
  @override
  LoginState build() {
    return const LoginState.initial();
  }

  AuthRepository get _authRepository => ref.read(authRepositoryProvider);

  Future<void> login({
    required String email,
    required String password,
  }) async {
    try {
      state = const LoginState.loading();
      await _authRepository.logOut();
      await _authRepository.logInWithEmailAndPassword(
        email: email,
        password: password,
      );
      state = const LoginState.success();
    } on AuthenticationException catch (e) {
      state = LoginState.error(exception: e);
    } on Exception catch (e, s) {
      state = LoginState.error(exception: AuthUnknownException(e, s, ''));
    }
  }

  void reset() => state = const LoginState.initial();
}
