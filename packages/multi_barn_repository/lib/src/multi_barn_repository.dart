import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';

class MultiBarnRepository {
  MultiBarnRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  // ==================== User Barn Roles ====================

  Future<List<UserBarnRole>> getUserBarnRoles({required String userId}) {
    return dataProviderClient.multiBarnResource.getUserBarnRoles(userId: userId);
  }

  Future<List<UserBarnRole>> getBarnMembers({required String barnId}) {
    return dataProviderClient.multiBarnResource.getBarnMembers(barnId: barnId);
  }

  Future<UserBarnRole?> getUserBarnRole({
    required String userId,
    required String barnId,
  }) {
    return dataProviderClient.multiBarnResource.getUserBarnRole(
      userId: userId,
      barnId: barnId,
    );
  }

  Future<UserBarnRole> addUserToBarn(AddUserToBarnPayload payload) {
    return dataProviderClient.multiBarnResource.addUserToBarn(payload);
  }

  Future<UserBarnRole> updateBarnRole(UpdateBarnRolePayload payload) {
    return dataProviderClient.multiBarnResource.updateBarnRole(payload);
  }

  Future<void> removeUserFromBarn({
    required String userId,
    required String barnId,
    required String removedBy,
  }) {
    return dataProviderClient.multiBarnResource.removeUserFromBarn(
      userId: userId,
      barnId: barnId,
      removedBy: removedBy,
    );
  }

  Future<void> setPrimaryBarn({
    required String userId,
    required String barnId,
  }) {
    return dataProviderClient.multiBarnResource.setPrimaryBarn(
      userId: userId,
      barnId: barnId,
    );
  }

  // ==================== Barn Summaries ====================

  Future<List<BarnSummary>> getUserBarnSummaries({required String userId}) {
    return dataProviderClient.multiBarnResource.getUserBarnSummaries(
      userId: userId,
    );
  }

  // ==================== Horse Transfers ====================

  Future<List<HorseTransfer>> getPendingTransfers({required String barnId}) {
    return dataProviderClient.multiBarnResource.getPendingTransfers(
      barnId: barnId,
    );
  }

  Future<List<HorseTransfer>> getTransferHistory({
    required String barnId,
    int? limit,
  }) {
    return dataProviderClient.multiBarnResource.getTransferHistory(
      barnId: barnId,
      limit: limit,
    );
  }

  Future<HorseTransfer> initiateTransfer(InitiateTransferPayload payload) {
    return dataProviderClient.multiBarnResource.initiateTransfer(payload);
  }

  Future<HorseTransfer> respondToTransfer(RespondToTransferPayload payload) {
    return dataProviderClient.multiBarnResource.respondToTransfer(payload);
  }

  Future<HorseTransfer> completeTransfer({required String transferId}) {
    return dataProviderClient.multiBarnResource.completeTransfer(
      transferId: transferId,
    );
  }
}
