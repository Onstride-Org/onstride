import 'package:models/models.dart';

/// Abstract resource for barn branding operations.
abstract class BrandingResource {
  /// Get branding for a barn.
  Future<BarnBranding?> getBarnBranding({required String barnId});

  /// Create or update barn branding.
  Future<BarnBranding> saveBarnBranding(BarnBranding branding);

  /// Upload a logo and return the URL.
  Future<String> uploadLogo({
    required String barnId,
    required String filePath,
    required bool isIcon,
  });

  /// Delete a logo.
  Future<void> deleteLogo({
    required String barnId,
    required bool isIcon,
  });

  /// Reset branding to defaults.
  Future<void> resetBranding({
    required String barnId,
    required String resetBy,
  });

  /// Verify custom domain ownership.
  Future<bool> verifyCustomDomain({
    required String barnId,
    required String domain,
  });
}
