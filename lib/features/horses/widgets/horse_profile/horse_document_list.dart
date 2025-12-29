import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';
import 'package:url_launcher/url_launcher.dart';

class HorseDocumentList extends StatelessWidget {
  const HorseDocumentList({
    required this.horse,
    super.key,
  });

  final HorseModel horse;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(context.l10n.documentsTitle, style: context.headlineSmall),
        GLSpaces.px16,
        if (horse.documents.isEmpty) ...[
          Align(
            alignment: Alignment.centerLeft,
            child: Text(context.l10n.noDocumentsLabel),
          ),
        ] else ...[
          ...horse.documents.map(
            (document) => Padding(
              padding: 8.edgeInsetsB,
              child: HorseDocumentTile(
                document: document,
                onTap: () async {
                  final uri = Uri.parse(document.downloadUrl);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(
                      uri,
                      mode: LaunchMode.inAppBrowserView,
                    );
                  }
                },
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class HorseDocumentTile extends StatelessWidget {
  const HorseDocumentTile({
    required this.document,
    this.onTap,
    super.key,
  });

  final GLHorsesDocument document;
  final void Function()? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    document.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  GLSpaces.px4,
                  Row(
                    children: [
                      Icon(
                        document.contentType.toLowerCase().contains('image')
                            ? GLIcons.image
                            : GLIcons.file,
                      ),
                      Text(
                        '${document.fallBackExt.toUpperCase()} - ${document.sizeKb}${context.l10n.kbSizeLabel}',
                        style: const TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(
              GLIcons.download,
            ),
          ],
        ),
      ),
    );
  }
}
