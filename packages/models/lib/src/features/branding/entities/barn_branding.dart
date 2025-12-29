import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'barn_branding.freezed.dart';
part 'barn_branding.g.dart';

/// Branding and personalization settings for a barn.
@freezed
sealed class BarnBranding with _$BarnBranding {
  const factory BarnBranding({
    /// Same as barn ID
    required String id,

    /// Barn ID this branding belongs to
    required String barnId,

    /// Barn logo URL (Firebase Storage)
    String? logoUrl,

    /// Smaller logo for navigation/icons
    String? logoIconUrl,

    /// Primary brand color (hex, e.g., "#4CAF50")
    String? primaryColor,

    /// Secondary brand color (hex)
    String? secondaryColor,

    /// Accent color (hex)
    String? accentColor,

    /// Background color for light mode
    String? backgroundColor,

    /// Text color for headers
    String? headerTextColor,

    /// Custom font family name (if supported)
    String? fontFamily,

    /// Tagline/slogan
    String? tagline,

    /// Custom domain for web app (e.g., "mystable.onstride.com")
    String? customDomain,

    /// Whether custom domain is verified and active
    @Default(false) bool domainVerified,

    /// Welcome message for the dashboard
    String? welcomeMessage,

    /// Email footer text
    String? emailFooter,

    /// Show logo on invoices
    @Default(true) bool showLogoOnInvoices,

    /// Show address on invoices
    @Default(true) bool showAddressOnInvoices,

    /// Who reset the branding
    String? resetBy,

    /// Invoice header text/branding
    String? invoiceHeader,

    /// Invoice footer text
    String? invoiceFooter,

    /// Social media links
    String? facebookUrl,
    String? instagramUrl,
    String? twitterUrl,
    String? youtubeUrl,
    String? websiteUrl,

    /// Whether branding is enabled
    @Default(true) bool isEnabled,

    /// When branding was last updated
    @TimestampConverter() required DateTime updatedAt,

    /// Who last updated the branding
    String? updatedBy,
  }) = _BarnBranding;

  factory BarnBranding.fromJson(Map<String, dynamic> json) =>
      _$BarnBrandingFromJson(json);
}

extension BarnBrandingX on BarnBranding {
  /// Whether the barn has a logo set.
  bool get hasLogo => logoUrl != null && logoUrl!.isNotEmpty;

  /// Whether custom colors are set.
  bool get hasCustomColors =>
      primaryColor != null && primaryColor!.isNotEmpty;

  /// Whether the barn has any social links.
  bool get hasSocialLinks =>
      (facebookUrl != null && facebookUrl!.isNotEmpty) ||
      (instagramUrl != null && instagramUrl!.isNotEmpty) ||
      (twitterUrl != null && twitterUrl!.isNotEmpty) ||
      (youtubeUrl != null && youtubeUrl!.isNotEmpty) ||
      (websiteUrl != null && websiteUrl!.isNotEmpty);

  /// Get the effective logo URL (main or icon).
  String? get effectiveLogoUrl => logoUrl ?? logoIconUrl;

  /// Parse primary color to integer (for Flutter Color).
  int? get primaryColorValue {
    if (primaryColor == null || primaryColor!.isEmpty) return null;
    final hex = primaryColor!.replaceAll('#', '');
    if (hex.length == 6) {
      return int.parse('FF$hex', radix: 16);
    } else if (hex.length == 8) {
      return int.parse(hex, radix: 16);
    }
    return null;
  }

  /// Parse secondary color to integer (for Flutter Color).
  int? get secondaryColorValue {
    if (secondaryColor == null || secondaryColor!.isEmpty) return null;
    final hex = secondaryColor!.replaceAll('#', '');
    if (hex.length == 6) {
      return int.parse('FF$hex', radix: 16);
    } else if (hex.length == 8) {
      return int.parse(hex, radix: 16);
    }
    return null;
  }
}
