import 'dart:io' as io;

import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';
import 'package:rxdart/rxdart.dart';

/// A generic Authentication Client Interface.
class AccountRepository {
  AccountRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;
  BehaviorSubject<GLUser>? _accountStream;
  String? _accountId;

  Stream<GLUser> getAccountInfo(String id) {
    if (_accountStream != null && id == _accountId) {
      return _accountStream!.stream;
    }
    try {
      _accountStream = BehaviorSubject<GLUser>();
      _accountId = id;
      fetchUser(id: id);
    } catch (error) {
      _accountStream?.addError(error);
    }
    return _accountStream!.stream;
  }

  Future<GLUser> fetchUser({required String id}) async {
    try {
      final response = await dataProviderClient.accountsResource.fetchUser(
        id: id,
      );
      _accountStream?.add(response);
      return response;
    } catch (error) {
      _accountStream?.addError(error);
      rethrow;
    }
  }

  Future<GLUser> registerUserInDatabase({
    required String id,
    required CreateAccountRequest request,
  }) async {
    return dataProviderClient.accountsResource.registerUserInDatabase(
      id: id,
      request: request,
    );
  }

  Future<void> deleteAccount({
    required GLUser user,
    required String reason,
  }) async {
    await dataProviderClient.accountsResource.deleteAccount(
      user: user,
      reason: reason,
    );
  }

  Future<GLUser> updateAccount({
    required GLUser user,
  }) async {
    return dataProviderClient.accountsResource.updateAccount(user: user);
  }

  Future<String> updateProfilePicture({
    required GLUser user,
    required io.File profilePicture,
  }) async {
    final response = await dataProviderClient.accountsResource
        .updateProfilePicture(user: user, profilePicture: profilePicture);
    await fetchUser(id: user.email ?? '');
    return response;
  }
}
