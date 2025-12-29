// data/horses_repository.dart
import 'dart:io';

import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';

class HorseRepository {
  HorseRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  Future<void> deleteHorse({
    required HorseModel horse,
    required String deletedBy,
  }) {
    return dataProviderClient.horseResource.deleteHorse(
      horse: horse,
      deletedBy: deletedBy,
    );
  }

  Future<HorseModel> createHorse({
    required HorseRequest request,
    required List<File> files,
    GLUser? boarder,
  }) {
    return dataProviderClient.horseResource.createHorse(
      request: request,
      boarder: boarder,
      files: files,
    );
  }

  Future<HorseModel> updateHorse({
    required HorseModel horse,
    required HorseRequest request,
    GLUser? boarder,
    List<File> files = const [],
  }) {
    return dataProviderClient.horseResource.updateHorse(
      horse: horse,
      request: request,
      files: files,
      boarder: boarder,
    );
  }

  Future<List<HorseBreed>> getHorsesBreed() {
    return dataProviderClient.horseResource.getHorsesBreeds();
  }

  Future<List<HorseSexStatus>> getHorsesSexStatus() {
    return dataProviderClient.horseResource.getHorsesSexStatus();
  }

  Future<List<HorseModel>> fetchHorses({
    required String barnId,
    required bool reload,
    String? searchTerm,
  }) {
    return dataProviderClient.horseResource.fetchHorses(
      barnId: barnId,
      reload: reload,
      searchText: searchTerm,
    );
  }

  Future<List<HorseModel>> getAllBoarderHorses({
    required String barnId,
    required String boarderId,
  }) async {
    return dataProviderClient.horseResource.fetchBoarderHorses(
      barnId: barnId,
      boarderId: boarderId,
    );
  }
}
