// data/horses_resource.dart
import 'package:models/models.dart';

abstract class BarnsResource {
  const BarnsResource();

  Future<BarnModel> createBarn({
    required String ownerId,
    required String name,
    required String connectedAccountId,
  });

  Future<BarnModel?> getBarnById({required String barnId});

  Future<BarnModel> setBarnSetup({
    required String userId,
    required BarnModel barn,
    required BarnSetup setup,
  });

  Future<BarnModel> updateBarnPosition({
    required BarnModel barn,
    required StallPosition stall,
    StallPosition? previousStall,
  });

  Future<BarnModel> removeHorseFromStall({
    required BarnModel barn,
    required StallPosition stall,
  });
}
