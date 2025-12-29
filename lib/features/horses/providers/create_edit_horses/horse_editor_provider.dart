import 'dart:io';

import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:horse_repository/horse_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'horse_editor_provider.freezed.dart';
part 'horse_editor_provider.g.dart';
part 'horse_editor_state.dart';

@riverpod
class HorseEditor extends _$HorseEditor {
  HorseRepository get _repo => ref.read(horseRepositoryProvider);

  @override
  HorseEditorState build() => const HorseEditorState();

  // ------- Local files (to upload) -------
  void addFiles(List<File> files) {
    if (files.isEmpty) return;
    final existingPaths = state.pendingFiles.map((f) => f.path).toSet();
    final merged = [
      ...state.pendingFiles,
      ...files.where((f) => !existingPaths.contains(f.path)),
    ];
    state = state.copyWith(pendingFiles: merged);
  }

  void removeFileAt(int index) {
    if (index < 0 || index >= state.pendingFiles.length) return;
    final next = [...state.pendingFiles]..removeAt(index);
    state = state.copyWith(pendingFiles: next);
  }

  void clearFiles() => state = state.copyWith(pendingFiles: const []);

  // ------- Existing docs to delete -------
  void markDocumentToDelete(GLHorsesDocument doc) {
    if (state.documentsToDelete.any((d) => d.path == doc.path)) return;
    state = state.copyWith(
      documentsToDelete: [...state.documentsToDelete, doc],
    );
  }

  void unmarkDocumentToDelete(GLHorsesDocument doc) {
    state = state.copyWith(
      documentsToDelete: state.documentsToDelete
          .where((d) => d.path != doc.path)
          .toList(),
    );
  }

  void clearDocumentsToDelete() =>
      state = state.copyWith(documentsToDelete: const []);

  // ------- Actions -------
  Future<HorseModel?> create(HorseRequest request, GLUser? boarder) async {
    state = state.copyWith(status: RequestStatus.loading, exception: null);
    try {
      final model = await _repo.createHorse(
        request: request,
        boarder: boarder,
        files: state.pendingFiles,
      );
      state = state.copyWith(
        status: RequestStatus.success,
        horse: model,
        pendingFiles: const [],
        documentsToDelete: const [],
      );
      return model;
    } on DataProviderException catch (e) {
      state = state.copyWith(status: RequestStatus.error, exception: e);
      return null;
    } catch (e) {
      state = state.copyWith(
        status: RequestStatus.error,
        exception: UnknownDataProviderException(e.toString()),
      );
      return null;
    }
  }

  Future<HorseModel?> update({
    required HorseModel horseId,
    required HorseRequest request,
    GLUser? boarder,
  }) async {
    state = state.copyWith(status: RequestStatus.loading, exception: null);
    try {
      final model = await _repo.updateHorse(
        horse: horseId,
        boarder: boarder,
        request: request.copyWith(documentsToDelete: state.documentsToDelete),
        files: state.pendingFiles,
      );
      state = state.copyWith(
        status: RequestStatus.success,
        horse: model,
        pendingFiles: const [],
        documentsToDelete: const [],
      );
      return model;
    } on DataProviderException catch (e) {
      state = state.copyWith(status: RequestStatus.error, exception: e);
      return null;
    } catch (e) {
      state = state.copyWith(
        status: RequestStatus.error,
        exception: UnknownDataProviderException(e.toString()),
      );
      return null;
    }
  }
}
