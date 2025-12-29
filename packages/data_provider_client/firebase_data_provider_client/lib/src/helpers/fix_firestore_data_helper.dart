import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';

class FixFirestoreDataHelper with ResourceMixin {
  FixFirestoreDataHelper({
    FirebaseFirestore? firestore,
  }) : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  /// Add `deleted_at` field with current timestamp to all horses
  Future<void> addDeletedAtToAllHorses() async {
    final horses = await _db.collection('horses').get();
    final batch = _db.batch();
    for (final doc in horses.docs) {
      batch.update(doc.reference, {'deleted_at': null});
    }

    await batch.commit();
  }

  Future<void> backfillHorseSearchTerms({
    int pageSize = 300,
    bool onlyWhenMissing = false,
  }) async {
    var baseQuery = _db.collection('horses').orderBy('id');

    DocumentSnapshot<Map<String, dynamic>>? lastDoc;
    int updated = 0, scanned = 0;

    while (true) {
      var query = baseQuery.limit(pageSize);
      if (lastDoc != null) {
        query = query.startAfter([lastDoc.get('id')]);
      }

      final snap = await query.get();
      if (snap.docs.isEmpty) break;

      final batch = _db.batch();

      for (final doc in snap.docs) {
        scanned++;

        final data = doc.data();
        if (data == null) continue;

        // Skip if onlyWhenMissing and already has non-empty search_terms
        if (onlyWhenMissing) {
          final existing = (data['search_terms'] as List?)?.cast<String>() ??
              const <String>[];
          if (existing.isNotEmpty) continue;
        }

        final horseName = _safeString(data['name']);
        final breedCode = _readNestedCode(data['breed']);
        final sexStatusCode = _readNestedCode(data['sex_status']);
        final boarderId = _safeString(data['boarder_id']);

        String boarderName = '';
        if (boarderId.isNotEmpty) {
          boarderName = await _getBoarderName(boarderId);
        }

        final terms = buildSearchTerms(
          [horseName, breedCode, sexStatusCode, boarderName],
          excludes: [('_', ' ')],
        );

        // Only write if there's something to update
        if (terms.isNotEmpty) {
          batch.update(doc.reference, {
            'search_terms': terms,
            'updated_at': FieldValue.serverTimestamp(),
          });
          updated++;
        }
      }

      // Commit this page
      await batch.commit();
      lastDoc = snap.docs.last;
    }
  }

  /// Reads a nested map like {'code': 'something'} safely.
  String _readNestedCode(Object? value) {
    if (value is Map) {
      final code = value['code'];
      return _safeString(code);
    }
    return '';
  }

  String _safeString(Object? v) {
    if (v == null) return '';
    if (v is String) return v;
    return v.toString();
  }

  Future<String> _getBoarderName(String boarderId) async {
    try {
      final doc = await _db.collection('users').doc(boarderId).get();
      final data = doc.data();
      if (data == null) return '';
      return _safeString(data['name']);
    } catch (_) {
      return '';
    }
  }
}
