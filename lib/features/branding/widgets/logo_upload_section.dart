import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

/// A section widget for uploading and managing barn logos.
class LogoUploadSection extends StatelessWidget {
  const LogoUploadSection({
    required this.title,
    required this.description,
    this.logoUrl,
    required this.onUpload,
    required this.onDelete,
    this.isIcon = false,
    super.key,
  });

  final String title;
  final String description;
  final String? logoUrl;
  final VoidCallback onUpload;
  final VoidCallback onDelete;
  final bool isIcon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: GLColors.neutral50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: GLColors.neutral200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: context.bodyLarge.copyWith(fontWeight: FontWeight.w600),
          ),
          GLSpaces.px4,
          Text(
            description,
            style: context.bodySmall.copyWith(color: GLColors.neutral500),
          ),
          GLSpaces.px16,
          Row(
            children: [
              Container(
                width: isIcon ? 64 : 120,
                height: isIcon ? 64 : 80,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(isIcon ? 32 : 8),
                  border: Border.all(color: GLColors.neutral300),
                ),
                child: logoUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(isIcon ? 32 : 8),
                        child: Image.network(
                          logoUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _PlaceholderIcon(isIcon: isIcon),
                        ),
                      )
                    : _PlaceholderIcon(isIcon: isIcon),
              ),
              GLSpaces.px16,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ElevatedButton.icon(
                      onPressed: onUpload,
                      icon: const Icon(Icons.upload, size: 18),
                      label: Text(logoUrl != null ? 'Change' : 'Upload'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: GLColors.brand600,
                      ),
                    ),
                    if (logoUrl != null) ...[
                      GLSpaces.px8,
                      TextButton.icon(
                        onPressed: onDelete,
                        icon: const Icon(Icons.delete_outline, size: 18),
                        label: const Text('Remove'),
                        style: TextButton.styleFrom(
                          foregroundColor: GLColors.error600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PlaceholderIcon extends StatelessWidget {
  const _PlaceholderIcon({required this.isIcon});

  final bool isIcon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Icon(
        isIcon ? Icons.photo_outlined : Icons.image_outlined,
        color: GLColors.neutral400,
        size: isIcon ? 32 : 40,
      ),
    );
  }
}
