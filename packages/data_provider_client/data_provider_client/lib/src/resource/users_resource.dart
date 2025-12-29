// data/users_resource.dart
import 'package:models/models.dart';

///
abstract class UsersResource {
  ///
  const UsersResource();

  ///
  Future<List<GLUser>> fetchUsersByType({required AccountType accountType});

  ///
  Future<List<GLUser>> fetchBarnUsers({
    required String barnId,
    required bool reload,
  });

  ///
  Future<GLUser> createUser({
    required String ownerId,
    required CreateAccountRequest request,
  });

  ///
  Future<GLUser> editUser({
    required GLUser user,
    required EditUserRequest request,
  });

  ///
  Future<void> deleteBarnRelation({
    required GLUser user,
    required String deletedBy,
    required String barnId,
  });

  ///
  Future<List<GLUser>> fetchUsersByIds({required List<String> ids});

  ///
  Future<void> softDeleteStableOwner({
    required String ownerId,
    required String deletedBy,
    required String reason,
  });
}
