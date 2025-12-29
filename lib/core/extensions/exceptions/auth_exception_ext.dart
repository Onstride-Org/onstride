import 'package:auth_repository/auth_repository.dart';
import 'package:gl_horses/l10n/gen_l10n/app_localizations.dart';

extension AuthenticationExceptionX on AuthenticationException {
  String title(AppLocalizations l10n) {
    if (this is SignUpEmailInUseFailure) return l10n.emailInUseTitle;
    if (this is SignUpInvalidEmailFailure) return l10n.invalidEmailTitle;
    if (this is SignUpWeakPasswordFailure) return l10n.weakPasswordTitle;
    if (this is SignUpOperationNotAllowedFailure) {
      return l10n.operationNotAllowedTitle;
    }
    if (this is SignUpConnectionFailure) return l10n.noConnectionTitle;
    if (this is SignUpFailure) return l10n.signUpFailedTitle;

    if (this is ResetPasswordInvalidEmailFailure) return l10n.invalidEmailTitle;
    if (this is ResetPasswordUserNotFoundFailure) return l10n.userNotFoundTitle;
    if (this is ResetPasswordFailure) return l10n.resetPasswordFailedTitle;

    if (this is SendVerificationEmailInvalidEmailFailure) {
      return l10n.invalidEmailTitle;
    }
    if (this is SendVerificationEmailUserNotFoundFailure) {
      return l10n.userNotFoundTitle;
    }
    if (this is SendVerificationEmailFailure) {
      return l10n.verificationFailedTitle;
    }

    if (this is LogInWithEmailAndPasswordIncorrectCredentialsFailure) {
      return l10n.incorrectCredentialsTitle;
    }
    if (this is LogInWithEmailAndPasswordFailure) return l10n.loginFailedTitle;
    if (this is LogInWithGoogleFailure) return l10n.googleLoginFailedTitle;
    if (this is LogInWithAppleFailure) return l10n.appleLoginFailedTitle;
    if (this is LogInWithGoogleCanceled) return l10n.loginCanceledTitle;
    if (this is LogInConnectionFailure) return l10n.noConnectionTitle;

    if (this is LogOutFailure) return l10n.logoutFailedTitle;
    if (this is DeleteAccountFailure) return l10n.deleteAccountFailedTitle;

    if (this is UpdateUserFailure) return l10n.updateFailedTitle;
    if (this is AuthUnknownException) return l10n.unknownErrorTitle;
    if (this is UserNotFoundFailure) return l10n.userNotFoundTitle;

    return l10n.authErrorTitle;
  }

  String description(AppLocalizations l10n) {
    if (this is SignUpEmailInUseFailure) return l10n.emailInUseDesc;
    if (this is SignUpInvalidEmailFailure) return l10n.invalidEmailDesc;
    if (this is SignUpWeakPasswordFailure) return l10n.weakPasswordDesc;
    if (this is SignUpOperationNotAllowedFailure) {
      return l10n.operationNotAllowedDesc;
    }
    if (this is SignUpConnectionFailure) return l10n.noConnectionDesc;
    if (this is SignUpFailure) return l10n.signUpFailedDesc;

    if (this is ResetPasswordInvalidEmailFailure)
      return l10n.resetInvalidEmailDesc;
    if (this is ResetPasswordUserNotFoundFailure)
      return l10n.resetUserNotFoundDesc;
    if (this is ResetPasswordFailure) return l10n.resetFailedDesc;

    if (this is SendVerificationEmailInvalidEmailFailure) {
      return l10n.verificationInvalidEmailDesc;
    }
    if (this is SendVerificationEmailUserNotFoundFailure) {
      return l10n.verificationUserNotFoundDesc;
    }
    if (this is SendVerificationEmailFailure) {
      return l10n.verificationFailedDesc;
    }

    if (this is LogInWithEmailAndPasswordIncorrectCredentialsFailure) {
      return l10n.incorrectCredentialsDesc;
    }
    if (this is LogInWithEmailAndPasswordFailure) return l10n.loginFailedDesc;
    if (this is LogInWithGoogleFailure) return l10n.googleLoginFailedDesc;
    if (this is LogInWithAppleFailure) return l10n.appleLoginFailedDesc;
    if (this is LogInWithGoogleCanceled) return l10n.googleCanceledDesc;
    if (this is LogInConnectionFailure) return l10n.noConnectionDesc;

    if (this is LogOutFailure) return l10n.logoutFailedDesc;
    if (this is DeleteAccountFailure) return l10n.deleteAccountFailedDesc;

    if (this is UpdateUserFailure) return l10n.updateFailedDesc;
    if (this is AuthUnknownException) {
      final e = this as AuthUnknownException;
      return e.message.isNotEmpty ? e.message : l10n.unknownErrorDesc;
    }
    if (this is UserNotFoundFailure) return l10n.userNotFoundDesc;

    return l10n.authErrorDesc;
  }
}
