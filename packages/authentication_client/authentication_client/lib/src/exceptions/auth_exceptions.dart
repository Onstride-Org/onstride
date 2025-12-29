sealed class AuthenticationException implements Exception {
  AuthenticationException(this.error, this.stackTrace);

  final Object? error;
  final StackTrace? stackTrace;

  /// Converts a [FirebaseAuthException] into a custom [AuthenticationException].
  static AuthenticationException fromFirebaseCode(
    String code,
    Object? error,
    StackTrace? stackTrace,
  ) {
    switch (code) {
      // ───── LOGIN ERRORS ─────
      case 'invalid-email':
        return SignUpInvalidEmailFailure(error, stackTrace);

      case 'invalid-credential':
        return LogInWithEmailAndPasswordIncorrectCredentialsFailure(
          error,
          stackTrace,
        );

      case 'user-disabled':
        return LogInWithEmailAndPasswordFailure(error, stackTrace);

      case 'user-not-found':
        return UserNotFoundFailure(error, stackTrace);

      case 'wrong-password':
        return LogInWithEmailAndPasswordIncorrectCredentialsFailure(
          error,
          stackTrace,
        );

      case 'too-many-requests':
        return LogInWithEmailAndPasswordFailure(error, stackTrace);

      case 'network-request-failed':
        return LogInConnectionFailure(error, stackTrace);

      // ───── SIGN UP ERRORS ─────
      case 'email-already-in-use':
        return SignUpEmailInUseFailure(error, stackTrace);

      case 'operation-not-allowed':
        return SignUpOperationNotAllowedFailure(error, stackTrace);

      case 'weak-password':
        return SignUpWeakPasswordFailure(error, stackTrace);

      // ───── RESET PASSWORD ERRORS ─────
      case 'missing-email':
        return ResetPasswordInvalidEmailFailure(error, stackTrace);

      case 'internal-error':
        return ResetPasswordFailure(error, stackTrace);

      // ───── SEND EMAIL VERIFICATION ERRORS ─────
      case 'invalid-recipient-email':
        return SendVerificationEmailInvalidEmailFailure(error, stackTrace);

      case 'user-token-expired':
        return SendVerificationEmailFailure(error, stackTrace);

      // ───── RE-AUTHENTICATION / PHONE / MFA ERRORS ─────
      case 'requires-recent-login':
        return UpdateUserFailure(error, stackTrace);

      case 'invalid-verification-code':
      case 'invalid-verification-id':
        return AuthUnknownException(
          error,
          stackTrace,
          'Invalid verification code',
        ); // Extend if needed

      // ───── FALLBACK ─────
      default:
        return AuthUnknownException(error, stackTrace, '');
    }
  }
}

// ───────────── SIGN UP ─────────────

class SignUpFailure extends AuthenticationException {
  SignUpFailure(super.error, super.stackTrace);
}

class SignUpEmailInUseFailure extends SignUpFailure {
  SignUpEmailInUseFailure(super.error, super.stackTrace);
}

class SignUpInvalidEmailFailure extends SignUpFailure {
  SignUpInvalidEmailFailure(super.error, super.stackTrace);
}

class SignUpOperationNotAllowedFailure extends SignUpFailure {
  SignUpOperationNotAllowedFailure(super.error, super.stackTrace);
}

class SignUpWeakPasswordFailure extends SignUpFailure {
  SignUpWeakPasswordFailure(super.error, super.stackTrace);
}

class SignUpConnectionFailure extends SignUpFailure {
  SignUpConnectionFailure(super.error, super.stackTrace);
}

// ───────────── UPDATE ─────────────

class UpdateUserFailure extends AuthenticationException {
  UpdateUserFailure(super.error, super.stackTrace);
}

// ───────────── RESET PASSWORD ─────────────

class ResetPasswordFailure extends AuthenticationException {
  ResetPasswordFailure(super.error, super.stackTrace);
}

class ResetPasswordInvalidEmailFailure extends ResetPasswordFailure {
  ResetPasswordInvalidEmailFailure(super.error, super.stackTrace);
}

class ResetPasswordUserNotFoundFailure extends ResetPasswordFailure {
  ResetPasswordUserNotFoundFailure(super.error, super.stackTrace);
}

// ───────────── VERIFICATION EMAIL ─────────────

class SendVerificationEmailFailure extends AuthenticationException {
  SendVerificationEmailFailure(super.error, super.stackTrace);
}

class SendVerificationEmailInvalidEmailFailure
    extends SendVerificationEmailFailure {
  SendVerificationEmailInvalidEmailFailure(super.error, super.stackTrace);
}

class SendVerificationEmailUserNotFoundFailure
    extends SendVerificationEmailFailure {
  SendVerificationEmailUserNotFoundFailure(super.error, super.stackTrace);
}

// ───────────── LOGIN ─────────────

class LogInWithEmailAndPasswordFailure extends AuthenticationException {
  LogInWithEmailAndPasswordFailure(super.error, super.stackTrace);
}

class LogInWithEmailAndPasswordIncorrectCredentialsFailure
    extends LogInWithEmailAndPasswordFailure {
  LogInWithEmailAndPasswordIncorrectCredentialsFailure(
    super.error,
    super.stackTrace,
  );
}

class LogInWithAppleFailure extends AuthenticationException {
  LogInWithAppleFailure(super.error, super.stackTrace);
}

class UserNotFoundFailure extends AuthenticationException {
  UserNotFoundFailure(super.error, super.stackTrace);
}

class LogInWithGoogleFailure extends AuthenticationException {
  LogInWithGoogleFailure(super.error, super.stackTrace);
}

class LogInWithGoogleCanceled extends AuthenticationException {
  LogInWithGoogleCanceled(super.error, super.stackTrace);
}

class LogInConnectionFailure extends AuthenticationException {
  LogInConnectionFailure(super.error, super.stackTrace);
}

// ───────────── LOGOUT & DELETE ─────────────

class LogOutFailure extends AuthenticationException {
  LogOutFailure(super.error, super.stackTrace);
}

class DeleteAccountFailure extends AuthenticationException {
  DeleteAccountFailure(super.error, super.stackTrace);
}

class AuthUnknownException extends AuthenticationException {
  AuthUnknownException(super.error, super.stackTrace, this.message);

  final String message;
}

class UserNeedCompleteTheirAccountException extends AuthenticationException {
  UserNeedCompleteTheirAccountException(
    super.error,
    super.stackTrace,
    this.userData,
  );

  final Map<String, dynamic> userData;
}
