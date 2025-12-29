// horse_documents_picker.dart
// Note: dart:io File class is used for native file picking, won't work on web
import 'dart:io';

import 'package:app_ui/app_ui.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/common/common.dart';
import 'package:models/models.dart';

final AutoDisposeStateNotifierProvider<SelectedHorseFilesNotifier, List<File>>
selectedHorseFilesProvider =
    StateNotifierProvider.autoDispose<SelectedHorseFilesNotifier, List<File>>(
      (ref) => SelectedHorseFilesNotifier(),
    );

class SelectedHorseFilesNotifier extends StateNotifier<List<File>> {
  SelectedHorseFilesNotifier() : super(const []);

  void addFiles(List<File> files) {
    final paths = state.map((f) => f.path).toSet();
    final merged = [
      ...state,
      ...files.where((f) => !paths.contains(f.path)),
    ];
    state = merged;
  }

  void removeAt(int index) {
    final next = [...state]..removeAt(index);
    state = next;
  }

  void clear() => state = const [];
}

class HorseDocumentsPicker extends ConsumerWidget {
  const HorseDocumentsPicker({
    required this.documents,
    required this.onDocumentsChanged,
    super.key,
    this.onRemoveExisting,
  });

  final ValueChanged<List<File>> onDocumentsChanged;
  final List<GLHorsesDocument> documents;
  final ValueChanged<GLHorsesDocument>? onRemoveExisting;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localFiles = ref.watch(selectedHorseFilesProvider);

    Future<void> _pickFiles() async {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.custom,
        allowedExtensions: const [
          'pdf',
          'png',
          'jpg',
          'jpeg',
          'heic',
          'webp',
          'doc',
          'docx',
        ],
      );

      if (result == null) return;

      final files = result.paths
          .whereType<String>()
          .map(File.new)
          .where((f) => f.path.isNotEmpty)
          .toList();

      if (files.isEmpty) return;

      ref.read(selectedHorseFilesProvider.notifier).addFiles(files);
      onDocumentsChanged(ref.read(selectedHorseFilesProvider));
    }

    void removeLocal(int index) {
      ref.read(selectedHorseFilesProvider.notifier).removeAt(index);
      onDocumentsChanged(ref.read(selectedHorseFilesProvider));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const FormLabel('Upload documents'),
        GLSpaces.px8,
        // Upload input (read-only)
        TextFormField(
          readOnly: true,
          onTap: _pickFiles,
          decoration: InputDecoration(
            hintText: 'Upload file',
            suffixIcon: IconButton(
              tooltip: 'Select files',
              onPressed: _pickFiles,
              icon: const Icon(GLIcons.uplload),
            ),
          ),
        ),
        GLSpaces.px8,

        if (documents.isNotEmpty) ...[
          ...documents.map(
            (doc) => ExistingDocTile(
              document: doc,
              onRemove: onRemoveExisting,
            ),
          ),
          GLSpaces.px4,
        ],

        if (localFiles.isNotEmpty) ...[
          ...List.generate(
            localFiles.length,
            (i) => _LocalFileTile(
              file: localFiles[i],
              onRemove: () => removeLocal(i),
            ),
          ),
        ],
      ],
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: 6.edgeInsetsA,
      decoration: BoxDecoration(
        color: color.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class ExistingDocTile extends StatelessWidget {
  const ExistingDocTile({
    required this.document,
    this.onRemove,
  });

  final GLHorsesDocument document;
  final ValueChanged<GLHorsesDocument>? onRemove;

  @override
  Widget build(BuildContext context) {
    final ext =
        _extFromContentType(document.contentType) ??
        _extFromPath(document.name) ??
        'file';
    final isPdf = ext == 'pdf';
    final badgeColor = isPdf ? GLColors.error500 : GLColors.brand500;

    return Column(
      children: [
        Row(
          children: [
            _Badge(label: ext, color: badgeColor),
            GLSpaces.px8,
            Expanded(
              child: Text(
                document.name,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            if (onRemove != null)
              IconButton(
                tooltip: 'Remove',
                onPressed: onRemove == null ? null : () => onRemove!(document),
                icon: Icon(
                  GLIcons.x,
                  color: onRemove == null
                      ? GLColors.neutral300
                      : GLColors.neutral600,
                ),
              ),
          ],
        ),
        if (onRemove != null)
          Divider(
            height: 4.sp,
            color: context.disableColor,
          ),
      ],
    );
  }
}

class _LocalFileTile extends StatelessWidget {
  const _LocalFileTile({
    required this.file,
    required this.onRemove,
  });

  final File file;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final ext = _extFromPath(file.path) ?? 'file';
    final isPdf = ext == 'pdf';
    final badgeColor = isPdf ? GLColors.error500 : GLColors.brand500;
    // Use '/' for web compatibility - works on all platforms for path splitting
    final name = file.path.split('/').last;

    return Column(
      children: [
        Row(
          children: [
            _Badge(label: ext, color: badgeColor),
            GLSpaces.px8,
            Expanded(
              child: Text(
                name,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            IconButton(
              tooltip: 'Remove',
              onPressed: onRemove,
              icon: const Icon(GLIcons.x),
            ),
          ],
        ),
        Divider(
          height: 4.sp,
          color: context.disableColor,
        ),
      ],
    );
  }
}

String? _extFromPath(String path) {
  final idx = path.lastIndexOf('.');
  if (idx == -1) return null;
  return path.substring(idx + 1).toLowerCase();
}

String? _extFromContentType(String ct) {
  if (ct.contains('pdf')) return 'pdf';
  if (ct.contains('png')) return 'png';
  if (ct.contains('jpeg') || ct.contains('jpg')) return 'jpg';
  if (ct.contains('heic')) return 'heic';
  if (ct.contains('webp')) return 'webp';
  if (ct.contains('msword')) return 'doc';
  if (ct.contains('officedocument.wordprocessingml')) return 'docx';
  return null;
}
