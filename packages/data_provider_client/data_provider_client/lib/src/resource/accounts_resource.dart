import 'dart:io';

import 'package:models/models.dart';

/// {@template no_such_account_exception}
/// Exception thrown when account with given id does not exist.
/// {@endtemplate}
/// {@template accounts_resource}

/// Resource responsible for the following endpoints:
///   - /accounts/{id} GET
///   - /accounts/{id} PUT
///   - /accounts/users/reset-deleted-at
/// {@endtemplate}
abstract class AccountsResource {
  /// {@macro accounts_resource}
  const AccountsResource();

  /// Change the first and last name for the account with the given id.

  Future<GLUser> fetchUser({required String id});

  ///
  Future<GLUser> updateAccount({required GLUser user});

  ///
  Future<void> deleteAccount({required GLUser user, required String reason});

  ///When user signs up with a social media account and doesnt have firstname
  ///and lastname
  Future<GLUser> registerUserInDatabase({
    required String id,
    required CreateAccountRequest request,
  });

  ////Self explanatory
  Future<String> updateProfilePicture({
    required GLUser user,
    required File profilePicture,
  });

  /// Reset deleted_at field to null for all users in the collection
  Future<void> resetDeletedAtForAllUsers();
}
