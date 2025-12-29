import 'package:data_provider_client/data_provider_client.dart';
import 'package:gl_horses/l10n/gen_l10n/app_localizations.dart';

extension DataProviderExceptionX on DataProviderException {
  /// A short technical name for the exception.
  /// For payments, this uses the PaymentErrorCode to produce a localized title.
  String name(AppLocalizations l10n) {
    return switch (this) {
      UnauthenticatedException() => l10n.unauthenticated,
      PermissionDeniedException() => l10n.permissionDenied,
      NotFoundException() => l10n.notFound,
      AlreadyExistsException() => l10n.alreadyExists,
      InvalidArgumentException() => l10n.invalidArgument,
      DeserializationException() => l10n.invalidArgument,
      UnavailableException() => l10n.unavailable,
      AbortedException() => l10n.aborted,
      ResourceExhaustedException() => l10n.resourceExhausted,
      DeadlineExceededException() => l10n.deadlineExceeded,
      DataLossException() => l10n.dataLoss,
      PlatformFailureException() => l10n.platformFailure,
      NotNetworkAccessException() => l10n.noNetwork,
      UnknownDataProviderException() => l10n.unknown,
      UserNotAvailableException() => l10n.userNotAvailable,
      UserAlreadyAssignedInYourBarnException() => l10n.userAlreadyInYourBarn,
      UserAlreadyAssignedInAnotherBarnException() =>
        l10n.userAlreadyInAnotherBarn,
      NotFoundBarnException() => l10n.barnNotAvailable,

      FailedPreconditionException() => l10n.failedPreconditionTitle,

      // Map payment codes to localized titles
      PaymentException(:final code) => switch (code) {
        PaymentErrorCode.failed => l10n.paymentFailedTitle,
        PaymentErrorCode.canceled => l10n.paymentCanceledTitle,
        PaymentErrorCode.timeout => l10n.paymentTimeoutTitle,
        PaymentErrorCode.unknown => l10n.paymentUnknownTitle,
      },

      // Processing (non-error) state title
      PaymentIsProcessingException() => l10n.paymentProcessingTitle,

      NotConnectedAccountException() => l10n.notFoundConnectedAccountId,
    };
  }

  /// A user-friendly description for UI or logs.
  /// For payments, prefers backend/Stripe message if present; otherwise uses localized fallbacks.
  String description(AppLocalizations l10n) {
    return switch (this) {
      UnauthenticatedException() => l10n.unauthenticatedDescription,
      PermissionDeniedException() => l10n.permissionDeniedDescription,
      NotFoundException() => l10n.notFoundDescription,
      AlreadyExistsException() => l10n.alreadyExistsDescription,
      InvalidArgumentException() => l10n.invalidArgumentDescription,
      UnavailableException() => l10n.unavailableDescription,
      AbortedException() => l10n.abortedDescription,
      ResourceExhaustedException() => l10n.resourceExhaustedDescription,
      DeadlineExceededException() => l10n.deadlineExceededDescription,
      DataLossException() => l10n.dataLossDescription,
      PlatformFailureException() => l10n.platformFailureDescription,
      NotNetworkAccessException() => l10n.noNetworkDescription,
      UnknownDataProviderException() => l10n.unknownDescription,
      UserNotAvailableException() => l10n.userNotAvailableDescription,
      UserAlreadyAssignedInYourBarnException() =>
        l10n.userAlreadyAssignedInYourBarnDescription,
      UserAlreadyAssignedInAnotherBarnException() =>
        l10n.userAlreadyAssignedInAnotherBarnDescription,
      NotFoundBarnException() => l10n.barnNotFoundDescription,
      DeserializationException(:final className, :final key) =>
        l10n.invalidFieldDescription(className, key),
      FailedPreconditionException() => l10n.failedPreconditionMessage,

      // Use specific backend/Stripe-provided message if available; otherwise fallback per code
      PaymentException(:final message, :final code) =>
        message ??
            switch (code) {
              PaymentErrorCode.failed => l10n.paymentFailedDescription,
              PaymentErrorCode.canceled => l10n.paymentCanceledDescription,
              PaymentErrorCode.timeout => l10n.paymentTimeoutDescription,
              PaymentErrorCode.unknown => l10n.paymentUnknownDescription,
            },

      // Processing (non-error) state description
      PaymentIsProcessingException() => l10n.paymentProcessingDescription,

      NotConnectedAccountException() =>
        l10n.notFoundConnectedAccountIdDescription,
    };
  }
}
