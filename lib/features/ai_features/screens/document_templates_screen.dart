import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/ai_features/widgets/widgets.dart';
import 'package:models/models.dart';

/// Screen for managing and using document templates.
class DocumentTemplatesScreen extends StatelessWidget {
  const DocumentTemplatesScreen({
    required this.templates,
    required this.generatedDocuments,
    this.onUseTemplate,
    this.onEditTemplate,
    this.onDeleteTemplate,
    this.onCreateCustom,
    this.onViewDocument,
    this.onSendForSignature,
    super.key,
  });

  final List<DocumentTemplate> templates;
  final List<GeneratedDocument> generatedDocuments;
  final void Function(DocumentTemplate)? onUseTemplate;
  final void Function(DocumentTemplate)? onEditTemplate;
  final void Function(DocumentTemplate)? onDeleteTemplate;
  final VoidCallback? onCreateCustom;
  final void Function(GeneratedDocument)? onViewDocument;
  final void Function(GeneratedDocument)? onSendForSignature;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Documents'),
          actions: [
            if (onCreateCustom != null)
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: onCreateCustom,
                tooltip: 'Create Custom Template',
              ),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Templates'),
              Tab(text: 'Generated'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _TemplatesTab(
              templates: templates,
              onUse: onUseTemplate,
              onEdit: onEditTemplate,
              onDelete: onDeleteTemplate,
              onCreateCustom: onCreateCustom,
            ),
            _GeneratedTab(
              documents: generatedDocuments,
              onView: onViewDocument,
              onSend: onSendForSignature,
            ),
          ],
        ),
      ),
    );
  }
}

class _TemplatesTab extends StatelessWidget {
  const _TemplatesTab({
    required this.templates,
    this.onUse,
    this.onEdit,
    this.onDelete,
    this.onCreateCustom,
  });

  final List<DocumentTemplate> templates;
  final void Function(DocumentTemplate)? onUse;
  final void Function(DocumentTemplate)? onEdit;
  final void Function(DocumentTemplate)? onDelete;
  final VoidCallback? onCreateCustom;

  @override
  Widget build(BuildContext context) {
    if (templates.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.description_outlined,
              size: 64,
              color: GLColors.neutral400,
            ),
            GLSpaces.px16,
            Text(
              'No templates available',
              style: context.titleMedium.copyWith(color: GLColors.neutral600),
            ),
            GLSpaces.px8,
            Text(
              'Create custom templates for your barn',
              style: context.bodyMedium.copyWith(color: GLColors.neutral500),
            ),
            GLSpaces.px16,
            if (onCreateCustom != null)
              FilledButton.icon(
                onPressed: onCreateCustom,
                icon: const Icon(Icons.add),
                label: const Text('Create Template'),
              ),
          ],
        ),
      );
    }

    final systemTemplates = templates.where((t) => t.isSystemTemplate).toList();
    final customTemplates = templates.where((t) => !t.isSystemTemplate).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // System templates
        if (systemTemplates.isNotEmpty) ...[
          Text(
            'System Templates',
            style: context.titleSmall.copyWith(
              fontWeight: FontWeight.w600,
              color: GLColors.neutral600,
            ),
          ),
          GLSpaces.px8,
          ...systemTemplates.map((t) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: DocumentTemplateCard(
                  template: t,
                  onUse: onUse != null ? () => onUse!(t) : null,
                ),
              )),
          GLSpaces.px16,
        ],

        // Custom templates
        if (customTemplates.isNotEmpty) ...[
          Text(
            'Custom Templates',
            style: context.titleSmall.copyWith(
              fontWeight: FontWeight.w600,
              color: GLColors.neutral600,
            ),
          ),
          GLSpaces.px8,
          ...customTemplates.map((t) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: DocumentTemplateCard(
                  template: t,
                  onUse: onUse != null ? () => onUse!(t) : null,
                  onEdit: onEdit != null ? () => onEdit!(t) : null,
                  onDelete: onDelete != null ? () => onDelete!(t) : null,
                ),
              )),
        ],

        // Create new button
        if (onCreateCustom != null) ...[
          GLSpaces.px16,
          OutlinedButton.icon(
            onPressed: onCreateCustom,
            icon: const Icon(Icons.add),
            label: const Text('Create Custom Template'),
          ),
        ],
      ],
    );
  }
}

class _GeneratedTab extends StatelessWidget {
  const _GeneratedTab({
    required this.documents,
    this.onView,
    this.onSend,
  });

  final List<GeneratedDocument> documents;
  final void Function(GeneratedDocument)? onView;
  final void Function(GeneratedDocument)? onSend;

  @override
  Widget build(BuildContext context) {
    if (documents.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.folder_open,
              size: 64,
              color: GLColors.neutral400,
            ),
            GLSpaces.px16,
            Text(
              'No documents generated yet',
              style: context.titleMedium.copyWith(color: GLColors.neutral600),
            ),
            GLSpaces.px8,
            Text(
              'Use a template to create your first document',
              style: context.bodyMedium.copyWith(color: GLColors.neutral500),
            ),
          ],
        ),
      );
    }

    // Group by status
    final pending = documents
        .where((d) =>
            d.status == GeneratedDocumentStatus.draft ||
            d.status == GeneratedDocumentStatus.pendingSignature ||
            d.status == GeneratedDocumentStatus.partiallySigned)
        .toList();
    final completed = documents
        .where((d) => d.status == GeneratedDocumentStatus.fullySigned)
        .toList();
    final other = documents
        .where((d) =>
            d.status == GeneratedDocumentStatus.expired ||
            d.status == GeneratedDocumentStatus.cancelled)
        .toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (pending.isNotEmpty) ...[
          _SectionHeader(title: 'In Progress', count: pending.length),
          ...pending.map((d) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GeneratedDocumentCard(
                  document: d,
                  onView: onView != null ? () => onView!(d) : null,
                  onSendForSignature: onSend != null ? () => onSend!(d) : null,
                ),
              )),
          GLSpaces.px16,
        ],
        if (completed.isNotEmpty) ...[
          _SectionHeader(title: 'Completed', count: completed.length),
          ...completed.map((d) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GeneratedDocumentCard(
                  document: d,
                  onView: onView != null ? () => onView!(d) : null,
                ),
              )),
          GLSpaces.px16,
        ],
        if (other.isNotEmpty) ...[
          _SectionHeader(title: 'Archived', count: other.length),
          ...other.map((d) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GeneratedDocumentCard(
                  document: d,
                  onView: onView != null ? () => onView!(d) : null,
                ),
              )),
        ],
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.count});

  final String title;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Text(
            title,
            style: context.titleSmall.copyWith(fontWeight: FontWeight.w600),
          ),
          GLSpaces.px8,
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: GLColors.neutral200,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              count.toString(),
              style: context.bodySmall.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
