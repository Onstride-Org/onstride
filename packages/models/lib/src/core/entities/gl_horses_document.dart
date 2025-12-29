import 'package:freezed_annotation/freezed_annotation.dart';

part 'gl_horses_document.freezed.dart';
part 'gl_horses_document.g.dart';

@freezed
sealed class GLHorsesDocument with _$GLHorsesDocument {
  const factory GLHorsesDocument({
    required String name, // Original file name (e.g. vet_report.pdf)
    required String path,
    required String downloadUrl, // Public/authorized URL for reading
    required String contentType, // e.g. application/pdf, image/png
    required int sizeBytes, // File size
    required DateTime createdAt, // Upload timestamp
    @Default('') String extension,
  }) = _GLHorsesDocument;

  factory GLHorsesDocument.fromJson(Map<String, dynamic> json) =>
      _$GLHorsesDocumentFromJson(json);
}

extension GLHorsesDocumentExt on GLHorsesDocument {
  int get sizeKb => (sizeBytes / 1024).round();

  String get fallBackExt {
    if (extension.isNotEmpty) return extension;
    final split = name.split('.');
    if (split.isNotEmpty) return split.last;
    final split2 = contentType.split('/');
    if (split2.isNotEmpty) return split2.last;
    return '';
  }
}
