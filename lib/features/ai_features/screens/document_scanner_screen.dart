import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/ai_features/widgets/widgets.dart';
import 'package:models/models.dart';

/// Screen for scanning and processing documents.
class DocumentScannerScreen extends StatelessWidget {
  const DocumentScannerScreen({
    required this.scannedDocuments,
    required this.horses,
    this.onScanNew,
    this.onConfirmDocument,
    this.onRejectDocument,
    this.onChangeHorse,
    super.key,
  });

  final List<ScannedDocument> scannedDocuments;
  final List<HorseModel> horses;
  final VoidCallback? onScanNew;
  final void Function(ScannedDocument)? onConfirmDocument;
  final void Function(ScannedDocument)? onRejectDocument;
  final void Function(ScannedDocument)? onChangeHorse;

  @override
  Widget build(BuildContext context) {
    final needsReview = scannedDocuments
        .where((d) => d.status == DocumentProcessingStatus.needsReview)
        .toList();
    final processing = scannedDocuments
        .where((d) =>
            d.status == DocumentProcessingStatus.pending ||
            d.status == DocumentProcessingStatus.processing)
        .toList();
    final completed = scannedDocuments
        .where((d) => d.status == DocumentProcessingStatus.completed)
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Document Scanner'),
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline),
            onPressed: () => _showHelpDialog(context),
            tooltip: 'Help',
          ),
        ],
      ),
      body: scannedDocuments.isEmpty
          ? _EmptyState(onScan: onScanNew)
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Needs Review section
                if (needsReview.isNotEmpty) ...[
                  _SectionHeader(
                    icon: Icons.rate_review,
                    title: 'Needs Review',
                    count: needsReview.length,
                    color: Colors.orange,
                  ),
                  ...needsReview.map((doc) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: DocumentScanCard(
                          document: doc,
                          onConfirm: onConfirmDocument != null
                              ? () => onConfirmDocument!(doc)
                              : null,
                          onReject: onRejectDocument != null
                              ? () => onRejectDocument!(doc)
                              : null,
                          onEditHorse: onChangeHorse != null
                              ? () => onChangeHorse!(doc)
                              : null,
                        ),
                      )),
                  GLSpaces.px16,
                ],

                // Processing section
                if (processing.isNotEmpty) ...[
                  _SectionHeader(
                    icon: Icons.hourglass_empty,
                    title: 'Processing',
                    count: processing.length,
                    color: Colors.blue,
                  ),
                  ...processing.map((doc) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: DocumentScanCard(document: doc),
                      )),
                  GLSpaces.px16,
                ],

                // Completed section
                if (completed.isNotEmpty) ...[
                  _SectionHeader(
                    icon: Icons.check_circle,
                    title: 'Completed',
                    count: completed.length,
                    color: Colors.green,
                  ),
                  ...completed.take(5).map((doc) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: DocumentScanCard(document: doc),
                      )),
                  if (completed.length > 5)
                    TextButton(
                      onPressed: () {
                        // Navigate to full history
                      },
                      child: Text('View all ${completed.length} completed'),
                    ),
                ],
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: onScanNew,
        icon: const Icon(Icons.document_scanner),
        label: const Text('Scan Document'),
      ),
    );
  }

  void _showHelpDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Document Scanner'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Supported Documents:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('• Coggins Tests'),
            Text('• Health Certificates'),
            Text('• Registration Papers'),
            Text('• Vaccination Records'),
            Text('• Veterinary Reports'),
            SizedBox(height: 16),
            Text(
              'How it works:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('1. Take a photo or upload a document'),
            Text('2. AI detects the document type'),
            Text('3. Key information is extracted'),
            Text('4. Match to a horse in your barn'),
            Text('5. Review and confirm to save'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({this.onScan});

  final VoidCallback? onScan;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: GLColors.brand50,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.document_scanner,
                size: 64,
                color: GLColors.brand600,
              ),
            ),
            GLSpaces.px24,
            Text(
              'Scan Your Documents',
              style: context.titleLarge.copyWith(fontWeight: FontWeight.bold),
            ),
            GLSpaces.px12,
            Text(
              'Take a photo of Coggins tests, health certificates, '
              'and other horse documents. Our AI will extract the '
              'important information automatically.',
              style: context.bodyMedium.copyWith(color: GLColors.neutral600),
              textAlign: TextAlign.center,
            ),
            GLSpaces.px24,
            FilledButton.icon(
              onPressed: onScan,
              icon: const Icon(Icons.camera_alt),
              label: const Text('Scan First Document'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.icon,
    required this.title,
    required this.count,
    required this.color,
  });

  final IconData icon;
  final String title;
  final int count;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          GLSpaces.px8,
          Text(
            title,
            style: context.titleSmall.copyWith(fontWeight: FontWeight.w600),
          ),
          GLSpaces.px8,
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              count.toString(),
              style: context.bodySmall.copyWith(
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
