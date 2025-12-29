// data/horses_resource.dart
import 'dart:io';

import 'package:models/models.dart';

abstract class HorseResource {
  const HorseResource();

  Future<HorseModel> createHorse({
    required HorseRequest request,
    GLUser? boarder,
    required List<File> files,
  });

  Future<HorseModel> updateHorse({
    required HorseModel horse,
    required HorseRequest request,
    GLUser? boarder,
    List<File> files = const [],
  });

  Future<List<HorseModel>> fetchHorses({
    required String barnId,
    required bool reload,
    String? searchText,
  });

  Future<List<HorseBreed>> getHorsesBreeds();

  Future<List<HorseSexStatus>> getHorsesSexStatus();

  Future<List<HorseModel>> fetchBoarderHorses({
    required String barnId,
    required String boarderId,
  });

  Future<void> deleteHorse({
    required HorseModel horse,
    required String deletedBy,
  });
}
