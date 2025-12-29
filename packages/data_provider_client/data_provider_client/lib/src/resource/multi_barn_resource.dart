import 'package:models/models.dart';

/// Abstract resource for multi-barn operations.
abstract class MultiBarnResource {
  // User Barn Roles
  Future<List<UserBarnRole>> getUserBarnRoles({required String userId});
  Future<List<UserBarnRole>> getBarnMembers({required String barnId});
  Future<UserBarnRole?> getUserBarnRole({
    required String userId,
    required String barnId,
  });
  Future<UserBarnRole> addUserToBarn(AddUserToBarnPayload payload);
  Future<UserBarnRole> updateBarnRole(UpdateBarnRolePayload payload);
  Future<void> removeUserFromBarn({
    required String userId,
    required String barnId,
    required String removedBy,
  });
  Future<void> setPrimaryBarn({
    required String userId,
    required String barnId,
  });

  // Barn Summaries (for barn switcher)
  Future<List<BarnSummary>> getUserBarnSummaries({required String userId});

  // Horse Transfers
  Future<List<HorseTransfer>> getPendingTransfers({required String barnId});
  Future<List<HorseTransfer>> getTransferHistory({
    required String barnId,
    int? limit,
  });
  Future<HorseTransfer> initiateTransfer(InitiateTransferPayload payload);
  Future<HorseTransfer> respondToTransfer(RespondToTransferPayload payload);
  Future<HorseTransfer> completeTransfer({required String transferId});
}
