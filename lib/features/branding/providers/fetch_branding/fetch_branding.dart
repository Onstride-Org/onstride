import 'package:branding_repository/branding_repository.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/branding/providers/fetch_branding/fetch_branding_state.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fetch_branding.g.dart';

@riverpod
class FetchBranding extends _$FetchBranding {
  BrandingRepository get _repo => ref.read(brandingRepositoryProvider);

  @override
  FetchBrandingState build() => const FetchBrandingState.initial();

  Future<void> fetch({required String barnId}) async {
    try {
      state = const FetchBrandingState.loading();
      final branding = await _repo.getBarnBranding(barnId: barnId);
      state = FetchBrandingState.success(branding: branding);
    } catch (e) {
      state = FetchBrandingState.error(message: e.toString());
    }
  }

  Future<void> saveBranding(BarnBranding branding) async {
    try {
      final saved = await _repo.saveBarnBranding(branding);
      state = FetchBrandingState.success(branding: saved);
    } catch (e) {
      state = FetchBrandingState.error(message: e.toString());
    }
  }

  Future<void> uploadLogo({
    required String barnId,
    required String filePath,
    required bool isIcon,
  }) async {
    try {
      state = const FetchBrandingState.loading();
      await _repo.uploadLogo(
        barnId: barnId,
        filePath: filePath,
        isIcon: isIcon,
      );
      // Refresh branding to get updated logo URL
      await fetch(barnId: barnId);
    } catch (e) {
      state = FetchBrandingState.error(message: e.toString());
    }
  }

  Future<void> deleteLogo({
    required String barnId,
    required bool isIcon,
  }) async {
    try {
      await _repo.deleteLogo(barnId: barnId, isIcon: isIcon);
      // Refresh branding
      await fetch(barnId: barnId);
    } catch (e) {
      state = FetchBrandingState.error(message: e.toString());
    }
  }

  Future<void> resetBranding({
    required String barnId,
    required String resetBy,
  }) async {
    try {
      await _repo.resetBranding(barnId: barnId, resetBy: resetBy);
      state = const FetchBrandingState.success(branding: null);
    } catch (e) {
      state = FetchBrandingState.error(message: e.toString());
    }
  }
}
