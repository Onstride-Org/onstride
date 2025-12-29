/// Base class for all exceptions thrown by data providers (e.g., Firebase).
sealed class DataProviderException implements Exception {
  const DataProviderException();
}

/// Thrown when the user is not authenticated or the auth token is invalid.
final class UnauthenticatedException extends DataProviderException {
  const UnauthenticatedException();
}

enum PaymentErrorCode { failed, canceled, timeout, unknown }

final class PaymentException extends DataProviderException {
  const PaymentException(this.code, this.message);

  final PaymentErrorCode code;
  final String? message;
}

final class PaymentIsProcessingException extends DataProviderException {
  const PaymentIsProcessingException();
}

/// Thrown when the user does not have permission to access a resource.
final class PermissionDeniedException extends DataProviderException {
  const PermissionDeniedException();
}

/// Thrown when a requested document or resource is not found.
final class NotFoundException extends DataProviderException {
  const NotFoundException();
}

final class NotFoundBarnException extends DataProviderException {
  const NotFoundBarnException();
}

final class NotConnectedAccountException extends DataProviderException {
  const NotConnectedAccountException();
}

/// Thrown when the client attempted to write a document that already exists.
final class AlreadyExistsException extends DataProviderException {
  const AlreadyExistsException();
}

/// Thrown when a resource already exists or there's a version conflict.
final class ConflictException extends DataProviderException {
  final String? message;

  const ConflictException({this.message});
}

/// Thrown when the request was invalid or malformed.
final class BadRequestException extends DataProviderException {
  final String? message;

  const BadRequestException({this.message});
}

/// Thrown when one or more fields sent to the server are invalid.
final class InvalidArgumentException extends DataProviderException {
  final String? message;

  const InvalidArgumentException(this.message);
}

/// Thrown when the server is unavailable (e.g., offline, maintenance, timeout).
final class UnavailableException extends DataProviderException {
  const UnavailableException();
}

/// Thrown when the server cancels the operation for internal reasons.
final class AbortedException extends DataProviderException {
  const AbortedException();
}

/// Thrown when the operation exceeds the usage limits or quota.
final class ResourceExhaustedException extends DataProviderException {
  const ResourceExhaustedException();
}

/// Thrown when a read or write operation takes too long.
final class DeadlineExceededException extends DataProviderException {
  const DeadlineExceededException();
}

/// Thrown when there is a data corruption or serious internal issue.
final class DataLossException extends DataProviderException {
  const DataLossException();
}

/// Thrown when there's a platform-specific issue (e.g., channel or plugin error).
final class PlatformFailureException extends DataProviderException {
  final Object error;

  const PlatformFailureException(this.error);
}

/// Thrown when an unexpected or unknown exception occurs.
final class UnknownDataProviderException extends DataProviderException {
  final String? message;

  const UnknownDataProviderException([this.message]);
}

final class NotNetworkAccessException extends DataProviderException {
  const NotNetworkAccessException();
}

final class UserNotAvailableException extends DataProviderException {
  const UserNotAvailableException();
}

final class UserAlreadyAssignedInYourBarnException
    extends DataProviderException {
  const UserAlreadyAssignedInYourBarnException();
}

final class UserAlreadyAssignedInAnotherBarnException
    extends DataProviderException {
  const UserAlreadyAssignedInAnotherBarnException();
}

final class FailedPreconditionException extends DataProviderException {
  const FailedPreconditionException();
}

/// Exception for JSON deserialization errors.
class DeserializationException extends DataProviderException {
  const DeserializationException({
    required this.className,
    required this.key,
    required this.message,
  });

  final String className;
  final String key;
  final String message;

  @override
  String toString() =>
      'DeserializationException(class=$className, key=$key, message=$message)';
}
