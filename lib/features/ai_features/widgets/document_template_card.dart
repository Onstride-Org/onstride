import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';

/// Card displaying a document template.
class DocumentTemplateCard extends StatelessWidget {
  const DocumentTemplateCard({
    required this.template,
    this.onUse,
    this.onEdit,
    this.onDelete,
    super.key,
  });

  final DocumentTemplate template;
  final VoidCallback? onUse;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = _getTypeInfo(template.type);

    return Card(
      child: InkWell(
        onTap: onUse,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, color: color, size: 24),
                  ),
                  GLSpaces.px12,
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                template.name,
                                style: context.titleSmall.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            if (template.isSystemTemplate)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: GLColors.neutral200,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'SYSTEM',
                                  style: context.bodySmall.copyWith(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: GLColors.neutral600,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        if (template.description != null) ...[
                          GLSpaces.px4,
                          Text(
                            template.description!,
                            style: context.bodySmall.copyWith(
                              color: GLColors.neutral600,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              GLSpaces.px16,
              Row(
                children: [
                  Icon(
                    Icons.edit_note,
                    size: 16,
                    color: GLColors.neutral500,
                  ),
                  GLSpaces.px4,
                  Text(
                    '${template.placeholders.length} fields',
                    style: context.bodySmall.copyWith(color: GLColors.neutral500),
                  ),
                  const Spacer(),
                  if (!template.isSystemTemplate && onEdit != null)
                    IconButton(
                      icon: const Icon(Icons.edit, size: 20),
                      onPressed: onEdit,
                      visualDensity: VisualDensity.compact,
                      tooltip: 'Edit',
                    ),
                  if (!template.isSystemTemplate && onDelete != null)
                    IconButton(
                      icon: const Icon(Icons.delete_outline, size: 20),
                      onPressed: onDelete,
                      visualDensity: VisualDensity.compact,
                      tooltip: 'Delete',
                      color: Colors.red,
                    ),
                  GLSpaces.px8,
                  FilledButton(
                    onPressed: onUse,
                    child: const Text('Use'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  (IconData, Color) _getTypeInfo(DocumentTemplateType type) {
    switch (type) {
      case DocumentTemplateType.liabilityWaiver:
        return (Icons.gavel, Colors.red);
      case DocumentTemplateType.boardingAgreement:
        return (Icons.home, Colors.blue);
      case DocumentTemplateType.leaseAgreement:
        return (Icons.handshake, Colors.green);
      case DocumentTemplateType.lessonContract:
        return (Icons.school, Colors.purple);
      case DocumentTemplateType.saleContract:
        return (Icons.attach_money, Colors.teal);
      case DocumentTemplateType.traineeAgreement:
        return (Icons.sports, Colors.orange);
      case DocumentTemplateType.coOwnershipAgreement:
        return (Icons.people, Colors.indigo);
      case DocumentTemplateType.breedingContract:
        return (Icons.pets, Colors.pink);
      case DocumentTemplateType.custom:
        return (Icons.description, GLColors.brand600);
    }
  }
}

/// Card displaying a generated document.
class GeneratedDocumentCard extends StatelessWidget {
  const GeneratedDocumentCard({
    required this.document,
    this.onView,
    this.onSendForSignature,
    this.onDownloadPdf,
    super.key,
  });

  final GeneratedDocument document;
  final VoidCallback? onView;
  final VoidCallback? onSendForSignature;
  final VoidCallback? onDownloadPdf;

  @override
  Widget build(BuildContext context) {
    final statusInfo = _getStatusInfo(document.status);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        document.templateName,
                        style: context.titleSmall.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      GLSpaces.px4,
                      Row(
                        children: [
                          Icon(
                            statusInfo.icon,
                            size: 16,
                            color: statusInfo.color,
                          ),
                          GLSpaces.px4,
                          Text(
                            statusInfo.label,
                            style: context.bodySmall.copyWith(
                              color: statusInfo.color,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Text(
                  _formatDate(document.createdAt),
                  style: context.bodySmall.copyWith(color: GLColors.neutral500),
                ),
              ],
            ),
            if (document.clientName != null || document.horseName != null) ...[
              GLSpaces.px12,
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: [
                  if (document.clientName != null)
                    Chip(
                      avatar: const Icon(Icons.person, size: 16),
                      label: Text(document.clientName!),
                      visualDensity: VisualDensity.compact,
                    ),
                  if (document.horseName != null)
                    Chip(
                      avatar: const Icon(Icons.pets, size: 16),
                      label: Text(document.horseName!),
                      visualDensity: VisualDensity.compact,
                    ),
                ],
              ),
            ],
            if (document.signatures.isNotEmpty) ...[
              GLSpaces.px12,
              _SignatureProgress(signatures: document.signatures),
            ],
            GLSpaces.px16,
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (onView != null)
                  TextButton.icon(
                    onPressed: onView,
                    icon: const Icon(Icons.visibility, size: 18),
                    label: const Text('View'),
                  ),
                if (onDownloadPdf != null && document.pdfUrl != null)
                  TextButton.icon(
                    onPressed: onDownloadPdf,
                    icon: const Icon(Icons.download, size: 18),
                    label: const Text('PDF'),
                  ),
                if (onSendForSignature != null &&
                    document.status == GeneratedDocumentStatus.draft) ...[
                  GLSpaces.px8,
                  FilledButton.icon(
                    onPressed: onSendForSignature,
                    icon: const Icon(Icons.send, size: 18),
                    label: const Text('Send'),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  ({IconData icon, Color color, String label}) _getStatusInfo(
    GeneratedDocumentStatus status,
  ) {
    switch (status) {
      case GeneratedDocumentStatus.draft:
        return (icon: Icons.edit, color: Colors.grey, label: 'Draft');
      case GeneratedDocumentStatus.pendingSignature:
        return (icon: Icons.pending, color: Colors.orange, label: 'Pending Signature');
      case GeneratedDocumentStatus.partiallySigned:
        return (icon: Icons.draw, color: Colors.blue, label: 'Partially Signed');
      case GeneratedDocumentStatus.fullySigned:
        return (icon: Icons.check_circle, color: Colors.green, label: 'Signed');
      case GeneratedDocumentStatus.expired:
        return (icon: Icons.timer_off, color: Colors.red, label: 'Expired');
      case GeneratedDocumentStatus.cancelled:
        return (icon: Icons.cancel, color: Colors.grey, label: 'Cancelled');
    }
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}

class _SignatureProgress extends StatelessWidget {
  const _SignatureProgress({required this.signatures});

  final List<DocumentSignature> signatures;

  @override
  Widget build(BuildContext context) {
    final signedCount = signatures.where((s) => s.isSigned).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Signatures: $signedCount/${signatures.length}',
              style: context.bodySmall.copyWith(color: GLColors.neutral600),
            ),
            const Spacer(),
            ...signatures.map((sig) => Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: Icon(
                    sig.isSigned ? Icons.check_circle : Icons.circle_outlined,
                    size: 16,
                    color: sig.isSigned ? Colors.green : GLColors.neutral400,
                  ),
                )),
          ],
        ),
      ],
    );
  }
}
