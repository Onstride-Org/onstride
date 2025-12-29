import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';

/// Card displaying a scanned document and its extracted data.
class DocumentScanCard extends StatelessWidget {
  const DocumentScanCard({
    required this.document,
    this.onConfirm,
    this.onReject,
    this.onEditHorse,
    super.key,
  });

  final ScannedDocument document;
  final VoidCallback? onConfirm;
  final VoidCallback? onReject;
  final VoidCallback? onEditHorse;

  @override
  Widget build(BuildContext context) {
    final (typeIcon, typeLabel) = _getTypeInfo(document.detectedType);
    final statusColor = _getStatusColor(document.status);

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with status
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                Icon(typeIcon, color: statusColor),
                GLSpaces.px12,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        typeLabel,
                        style: context.titleSmall.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        _getStatusLabel(document.status),
                        style: context.bodySmall.copyWith(color: statusColor),
                      ),
                    ],
                  ),
                ),
                if (document.typeConfidence > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '${(document.typeConfidence * 100).toInt()}%',
                      style: context.bodySmall.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Extracted fields
                if (document.extractedHorseName != null) ...[
                  _ExtractedField(
                    label: 'Horse Name',
                    value: document.extractedHorseName!,
                  ),
                ],
                if (document.extractedOwnerName != null) ...[
                  _ExtractedField(
                    label: 'Owner',
                    value: document.extractedOwnerName!,
                  ),
                ],
                if (document.extractedDate != null) ...[
                  _ExtractedField(
                    label: 'Date',
                    value: _formatDate(document.extractedDate!),
                  ),
                ],
                if (document.extractedExpirationDate != null) ...[
                  _ExtractedField(
                    label: 'Expires',
                    value: _formatDate(document.extractedExpirationDate!),
                    isWarning: document.extractedExpirationDate!
                        .isBefore(DateTime.now().add(const Duration(days: 30))),
                  ),
                ],
                if (document.extractedTestResult != null) ...[
                  _ExtractedField(
                    label: 'Result',
                    value: document.extractedTestResult!,
                    isPositive: document.extractedTestResult!.toLowerCase() == 'negative',
                  ),
                ],

                // Horse match section
                if (document.suggestedHorseId != null) ...[
                  GLSpaces.px16,
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: GLColors.brand50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: GLColors.brand200),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.pets, color: GLColors.brand600),
                        GLSpaces.px12,
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Matched to: ${document.suggestedHorseName}',
                                style: context.bodyMedium.copyWith(
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              Text(
                                '${(document.horseMatchConfidence * 100).toInt()}% confidence',
                                style: context.bodySmall.copyWith(
                                  color: GLColors.neutral600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (onEditHorse != null)
                          TextButton(
                            onPressed: onEditHorse,
                            child: const Text('Change'),
                          ),
                      ],
                    ),
                  ),
                ],

                // Error message
                if (document.errorMessage != null) ...[
                  GLSpaces.px16,
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red),
                        GLSpaces.px8,
                        Expanded(
                          child: Text(
                            document.errorMessage!,
                            style: context.bodySmall.copyWith(color: Colors.red),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Action buttons
                if (document.status == DocumentProcessingStatus.needsReview) ...[
                  GLSpaces.px16,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (onReject != null)
                        TextButton(
                          onPressed: onReject,
                          child: const Text('Discard'),
                        ),
                      GLSpaces.px8,
                      if (onConfirm != null)
                        FilledButton.icon(
                          onPressed: onConfirm,
                          icon: const Icon(Icons.check, size: 18),
                          label: const Text('Save to Horse'),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  (IconData, String) _getTypeInfo(ScannedDocumentType? type) {
    switch (type) {
      case ScannedDocumentType.coggins:
        return (Icons.science, 'Coggins Test');
      case ScannedDocumentType.healthCertificate:
        return (Icons.verified_user, 'Health Certificate');
      case ScannedDocumentType.registration:
        return (Icons.badge, 'Registration');
      case ScannedDocumentType.vaccinationRecord:
        return (Icons.vaccines, 'Vaccination Record');
      case ScannedDocumentType.veterinaryReport:
        return (Icons.medical_services, 'Veterinary Report');
      case ScannedDocumentType.insurance:
        return (Icons.shield, 'Insurance');
      case ScannedDocumentType.billOfSale:
        return (Icons.receipt_long, 'Bill of Sale');
      case ScannedDocumentType.other:
      case null:
        return (Icons.description, 'Document');
    }
  }

  Color _getStatusColor(DocumentProcessingStatus status) {
    switch (status) {
      case DocumentProcessingStatus.pending:
        return Colors.grey;
      case DocumentProcessingStatus.processing:
        return Colors.blue;
      case DocumentProcessingStatus.completed:
        return Colors.green;
      case DocumentProcessingStatus.failed:
        return Colors.red;
      case DocumentProcessingStatus.needsReview:
        return Colors.orange;
    }
  }

  String _getStatusLabel(DocumentProcessingStatus status) {
    switch (status) {
      case DocumentProcessingStatus.pending:
        return 'Pending';
      case DocumentProcessingStatus.processing:
        return 'Processing...';
      case DocumentProcessingStatus.completed:
        return 'Completed';
      case DocumentProcessingStatus.failed:
        return 'Failed';
      case DocumentProcessingStatus.needsReview:
        return 'Needs Review';
    }
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}

class _ExtractedField extends StatelessWidget {
  const _ExtractedField({
    required this.label,
    required this.value,
    this.isWarning = false,
    this.isPositive = false,
  });

  final String label;
  final String value;
  final bool isWarning;
  final bool isPositive;

  @override
  Widget build(BuildContext context) {
    Color? valueColor;
    if (isWarning) valueColor = Colors.orange;
    if (isPositive) valueColor = Colors.green;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: context.bodySmall.copyWith(color: GLColors.neutral500),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: context.bodyMedium.copyWith(
                fontWeight: FontWeight.w500,
                color: valueColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Button to initiate document scanning.
class ScanDocumentButton extends StatelessWidget {
  const ScanDocumentButton({required this.onPressed, super.key});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton.icon(
      onPressed: onPressed,
      icon: const Icon(Icons.document_scanner),
      label: const Text('Scan Document'),
    );
  }
}
