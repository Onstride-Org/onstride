import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';

class BarnsRepository {
  BarnsRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  Future<BarnModel> createBarn({
    required String ownerId,
    required String name,
    required String connectedAccountId,
  }) async {
    return dataProviderClient.barnsResource.createBarn(
      ownerId: ownerId,
      name: name,
      connectedAccountId: connectedAccountId,
    );
  }

  Future<BarnModel?> getBarnById({required String? barnId}) async {
    if (barnId == null) return null;
    return dataProviderClient.barnsResource.getBarnById(barnId: barnId);
  }

  Future<BarnModel> setBarnSetup({
    required String userId,
    required BarnModel barn,
    required BarnSetup setup,
  }) async {
    return dataProviderClient.barnsResource.setBarnSetup(
      userId: userId,
      barn: barn,
      setup: setup,
    );
  }

  Future<BarnModel> updateBarnPosition({
    required BarnModel barn,
    required StallPosition stall,
    StallPosition? previousStall,
  }) => dataProviderClient.barnsResource.updateBarnPosition(
    barn: barn,
    stall: stall,
    previousStall: previousStall,
  );

  Future<BarnModel> removeHorseFromStall({
    required BarnModel barn,
    required StallPosition stall,
  }) => dataProviderClient.barnsResource.removeHorseFromStall(
    barn: barn,
    stall: stall,
  );
}
