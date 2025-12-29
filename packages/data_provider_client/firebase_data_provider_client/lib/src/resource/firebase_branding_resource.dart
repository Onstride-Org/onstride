import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:models/models.dart';
import 'dart:io';

/// {@template firebase_branding_resource}
/// Firebase-backed resource for barn branding operations.
/// {@endtemplate}
class FirebaseBrandingResource with ResourceMixin implements BrandingResource {
  /// {@macro firebase_branding_resource}
  FirebaseBrandingResource({
    FirebaseFirestore? firebase,
    FirebaseStorage? storage,
  })  : _firebase = firebase ?? FirebaseFirestore.instance,
        _storage = storage ?? FirebaseStorage.instance;

  final FirebaseFirestore _firebase;
  final FirebaseStorage _storage;

  CollectionReference<Map<String, dynamic>> get _brandingCollection =>
      _firebase.collection('barn_branding');

  @override
  Future<BarnBranding?> getBarnBranding({required String barnId}) async {
    return secureCallback(
      () async {
        final snapshot = await _brandingCollection
            .where('barn_id', isEqualTo: barnId)
            .limit(1)
            .get();
        if (snapshot.docs.isEmpty) return null;
        return BarnBranding.fromJson(snapshot.docs.first.data());
      },
    );
  }

  @override
  Future<BarnBranding> saveBarnBranding(BarnBranding branding) async {
    return secureCallback(
      () async {
        final existing = await getBarnBranding(barnId: branding.barnId);
        final now = DateTime.now();

        if (existing != null) {
          // Update existing
          final docRef = _brandingCollection.doc(existing.id);
          final updated = branding.copyWith(
            id: existing.id,
            updatedAt: now,
          );
          await docRef.set(updated.toJson(), SetOptions(merge: true));
          return updated;
        } else {
          // Create new
          final docRef = _brandingCollection.doc();
          final newBranding = branding.copyWith(
            id: docRef.id,
            updatedAt: now,
          );
          await docRef.set(newBranding.toJson());
          return newBranding;
        }
      },
    );
  }

  @override
  Future<String> uploadLogo({
    required String barnId,
    required String filePath,
    required bool isIcon,
  }) async {
    return secureCallback(
      () async {
        final file = File(filePath);
        if (!await file.exists()) {
          throw const BadRequestException(message: 'File not found');
        }

        final fileName = isIcon ? 'icon' : 'logo';
        final extension = filePath.split('.').last.toLowerCase();
        final storagePath = 'barns/$barnId/branding/$fileName.$extension';

        final ref = _storage.ref().child(storagePath);
        final uploadTask = ref.putFile(
          file,
          SettableMetadata(contentType: 'image/$extension'),
        );

        final snapshot = await uploadTask;
        final downloadUrl = await snapshot.ref.getDownloadURL();

        // Update branding document
        final branding = await getBarnBranding(barnId: barnId);
        if (branding != null) {
          final updated = isIcon
              ? branding.copyWith(logoIconUrl: downloadUrl)
              : branding.copyWith(logoUrl: downloadUrl);
          await saveBarnBranding(updated);
        } else {
          // Create new branding with logo
          final newBranding = BarnBranding(
            id: '',
            barnId: barnId,
            logoUrl: isIcon ? null : downloadUrl,
            logoIconUrl: isIcon ? downloadUrl : null,
            updatedAt: DateTime.now(),
          );
          await saveBarnBranding(newBranding);
        }

        return downloadUrl;
      },
    );
  }

  @override
  Future<void> deleteLogo({
    required String barnId,
    required bool isIcon,
  }) async {
    return secureCallback<void>(
      () async {
        final branding = await getBarnBranding(barnId: barnId);
        if (branding == null) return;

        final logoUrl = isIcon ? branding.logoIconUrl : branding.logoUrl;
        if (logoUrl == null) return;

        // Delete from storage
        try {
          final ref = _storage.refFromURL(logoUrl);
          await ref.delete();
        } catch (_) {
          // Ignore storage errors - file may already be deleted
        }

        // Update branding document
        final updated = isIcon
            ? branding.copyWith(logoIconUrl: null)
            : branding.copyWith(logoUrl: null);
        await saveBarnBranding(updated);
      },
    );
  }

  @override
  Future<void> resetBranding({
    required String barnId,
    required String resetBy,
  }) async {
    return secureCallback<void>(
      () async {
        final branding = await getBarnBranding(barnId: barnId);
        if (branding == null) return;

        // Delete logos from storage
        if (branding.logoUrl != null) {
          try {
            final ref = _storage.refFromURL(branding.logoUrl!);
            await ref.delete();
          } catch (_) {}
        }

        if (branding.logoIconUrl != null) {
          try {
            final ref = _storage.refFromURL(branding.logoIconUrl!);
            await ref.delete();
          } catch (_) {}
        }

        // Reset branding to defaults
        final resetBranding = BarnBranding(
          id: branding.id,
          barnId: barnId,
          updatedAt: DateTime.now(),
          resetBy: resetBy,
        );

        await _brandingCollection.doc(branding.id).set(
              resetBranding.toJson(),
            );
      },
    );
  }

  @override
  Future<bool> verifyCustomDomain({
    required String barnId,
    required String domain,
  }) async {
    return secureCallback(
      () async {
        // In a real implementation, this would:
        // 1. Check DNS records for the domain
        // 2. Verify TXT record for domain ownership
        // 3. Configure SSL certificate
        // 4. Set up reverse proxy

        // For now, we just save the domain and return true
        // Real verification would be done via a Cloud Function
        final branding = await getBarnBranding(barnId: barnId);
        if (branding != null) {
          final updated = branding.copyWith(
            customDomain: domain,
            domainVerified: false, // Would be true after actual verification
          );
          await saveBarnBranding(updated);
        }

        return true;
      },
    );
  }
}
