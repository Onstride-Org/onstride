import 'package:auth_repository/auth_repository.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/config/config.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'send_reset_password_provider.freezed.dart';
part 'send_reset_password_provider.g.dart';
part 'send_reset_password_state.dart';

@riverpod
class ResetPassword extends _$ResetPassword {
  AuthRepository get _repository => ref.read(authRepositoryProvider);

  Future<void> sendResetEmail(String email) async {
    try {
      state = const ResetPasswordState.loading();
      await _repository.sendPasswordResetEmail(email: email);
      state = const ResetPasswordState.success();
    } on AuthenticationException catch (e) {
      state = ResetPasswordState.error(exception: e);
    } on Exception catch (e, s) {
      state = ResetPasswordState.error(
        exception: AuthUnknownException(e, s, ''),
      );
    }
  }

  @override
  ResetPasswordState build() => const ResetPasswordState.initial();
}
