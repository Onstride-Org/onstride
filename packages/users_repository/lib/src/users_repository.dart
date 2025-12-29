import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';

class UsersRepository {
  UsersRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  Future<List<GLUser>> fetchUsersByType({required AccountType accountType}) {
    return dataProviderClient.usersResource.fetchUsersByType(
      accountType: accountType,
    );
  }

  Future<List<GLUser>> fetchBarnUsers({
    required String barnId,
    required bool reload,
  }) {
    return dataProviderClient.usersResource.fetchBarnUsers(
      barnId: barnId,
      reload: reload,
    );
  }

  Future<GLUser> createUserForOwner({
    required String ownerId,
    required CreateAccountRequest request,
  }) {
    return dataProviderClient.usersResource.createUser(
      ownerId: ownerId,
      request: request,
    );
  }

  Future<GLUser> editUser({
    required GLUser user,
    required EditUserRequest request,
  }) {
    return dataProviderClient.usersResource.editUser(
      user: user,
      request: request,
    );
  }

  Future<void> deleteUser({
    required GLUser user,
    required String deletedBy,
    required String barnId,
  }) {
    return dataProviderClient.usersResource.deleteBarnRelation(
      user: user,
      barnId: barnId,
      deletedBy: deletedBy,
    );
  }

  Future<List<GLUser>> fetchUsersByIds(List<String> list) async {
    return dataProviderClient.usersResource.fetchUsersByIds(ids: list);
  }

  Future<void> softDeleteStableOwner({
    required String ownerId,
    required String deletedBy,
    required String reason,
  }) {
    return dataProviderClient.usersResource.softDeleteStableOwner(
      ownerId: ownerId,
      deletedBy: deletedBy,
      reason: reason,
    );
  }
}
