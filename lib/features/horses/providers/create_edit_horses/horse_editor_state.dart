// horse_editor_state.dart
part of 'horse_editor_provider.dart';

@freezed
sealed class HorseEditorState with _$HorseEditorState {
  const factory HorseEditorState({
    @Default(RequestStatus.initial) RequestStatus status,
    HorseModel? horse,
    DataProviderException? exception,
    @Default(<File>[]) List<File> pendingFiles,
    @Default(<GLHorsesDocument>[]) List<GLHorsesDocument> documentsToDelete,
  }) = _HorseEditorState;
}
