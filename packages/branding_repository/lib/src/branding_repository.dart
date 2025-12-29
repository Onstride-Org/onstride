import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';

class BrandingRepository {
  BrandingRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  Future<BarnBranding?> getBarnBranding({required String barnId}) {
    return dataProviderClient.brandingResource.getBarnBranding(barnId: barnId);
  }

  Future<BarnBranding> saveBarnBranding(BarnBranding branding) {
    return dataProviderClient.brandingResource.saveBarnBranding(branding);
  }

  Future<String> uploadLogo({
    required String barnId,
    required String filePath,
    required bool isIcon,
  }) {
    return dataProviderClient.brandingResource.uploadLogo(
      barnId: barnId,
      filePath: filePath,
      isIcon: isIcon,
    );
  }

  Future<void> deleteLogo({
    required String barnId,
    required bool isIcon,
  }) {
    return dataProviderClient.brandingResource.deleteLogo(
      barnId: barnId,
      isIcon: isIcon,
    );
  }

  Future<void> resetBranding({
    required String barnId,
    required String resetBy,
  }) {
    return dataProviderClient.brandingResource.resetBranding(
      barnId: barnId,
      resetBy: resetBy,
    );
  }

  Future<bool> verifyCustomDomain({
    required String barnId,
    required String domain,
  }) {
    return dataProviderClient.brandingResource.verifyCustomDomain(
      barnId: barnId,
      domain: domain,
    );
  }
}
