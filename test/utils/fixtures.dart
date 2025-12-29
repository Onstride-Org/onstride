// All code/comments in English (as requested).
import 'package:models/models.dart';

/// Returns a non-owner user (adjust fields to match your GLUser constructor).
GLUser makeNonOwnerUser({
  String id = 'u1',
  String email = 'u1@example.com',
}) {
  // Example if using freezed:
  // return GLUser(
  //   id: id,
  //   email: email,
  //   accountType: AccountType.manager,
  //   name: 'User One',
  //   phoneNumber: '+1000000000',
  //   ownerId: null,
  // );
  return GLUser.anonymous.copyWith(
    id: id,
    email: email,
    // If your `isOwner` derives from accountType, ensure it's a non-owner:
    accountType: AccountType.manager,
  );
}

/// Returns an owner user so that `isOwner == true`.
GLUser makeOwnerUser({
  String id = 'barn-1',
  String email = 'owner@example.com',
}) {
  return GLUser.anonymous.copyWith(
    id: id,
    email: email,
    accountType: AccountType.owner,
    barnId: id,
  );
}

/// Returns a minimal BarnModel instance.
BarnModel makeBarn({
  String id = 'barn-1',
  String name = 'Owner Barn',
}) {
  return BarnModel(id: id, name: name, ownerId: 'owner-id-1');
}
