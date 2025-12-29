@Deprecated('Use DataProviderException class')
sealed class AccountException implements Exception {
  const AccountException();
}

/// Exception thrown when account with given id does not exist.
final class NoSuchAccountException extends AccountException {
  const NoSuchAccountException(this.accountId);

  final String accountId;

  @override
  String toString() =>
      'NoSuchAccountException: No account found with ID $accountId';
}

/// Exception thrown when the account update fails due to server error.
final class AccountUpdateFailedException extends AccountException {
  const AccountUpdateFailedException();

  @override
  String toString() =>
      'AccountUpdateFailedException: Failed to update the account';
}

/// Exception thrown when the profile picture upload fails.
final class ProfilePictureUploadException extends AccountException {
  const ProfilePictureUploadException();

  @override
  String toString() =>
      'ProfilePictureUploadException: Failed to upload profile picture';
}

final class UnknownAccountException extends AccountException {
  const UnknownAccountException();
}
