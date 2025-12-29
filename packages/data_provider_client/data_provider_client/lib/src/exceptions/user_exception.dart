import 'package:models/models.dart';

@Deprecated('Use DataProviderException class')
sealed class UsersException implements Exception {
  const UsersException();
}

/// Exception thrown when users with given AccountType does not exist.
final class FetchUsersException extends UsersException {
  ///
  const FetchUsersException(this.accountType);

  ///
  final AccountType accountType;

  @override
  String toString() =>
      'FetchUsersException: No users found with account_type ${accountType.name}';
}
