// data/firebase_horses_resource.dart
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/extensions/firebase_collections_extensions.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:firebase_data_provider_client/src/util/util.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:models/models.dart';
import 'package:uuid/uuid.dart';

class FirebaseHorseResource with ResourceMixin implements HorseResource {
  FirebaseHorseResource({FirebaseFirestore? firebase})
      : _firebase = firebase ?? FirebaseFirestore.instance,
        _storage = FirebaseStorage.instance,
        _uuid = const Uuid();

  final FirebaseFirestore _firebase;
  final FirebaseStorage _storage;
  final Uuid _uuid;

  CollectionReference<Json> get _barns => _firebase.barns;

  CollectionReference<Json> get _horses => _firebase.horses;

  DocumentSnapshot? _lastHorseDocument;

  @override
  Future<List<HorseModel>> fetchHorses({
    required String barnId,
    required bool reload,
    String? searchText,
  }) {
    return secureCallback(
      () async {
        if (reload || searchText != null) {
          _lastHorseDocument = null;
        }
        var query = _horses
            .where('barn_id', isEqualTo: barnId)
            .where('deleted_at', isNull: true)
            .orderBy('created_at');
        if (searchText != null) {
          query = query.where(
            'search_terms',
            arrayContains: searchText.toLowerCase(),
          );
        }

        if (_lastHorseDocument != null) {
          query = query.startAfterDocument(_lastHorseDocument!);
        }
        final snapshot = await query.limit(defaultLimit).get();
        _lastHorseDocument =
            snapshot.docs.isNotEmpty ? snapshot.docs.last : _lastHorseDocument;
        return snapshot.docs
            .map((doc) => HorseModel.fromJson(doc.data()))
            .toList();
      },
    );
  }

  @override
  Future<List<HorseBreed>> getHorsesBreeds() {
    return secureCallback(
      () => _fetchAllLangValues(
        collectionPath: 'app_data/horses/horses_breed',
      ),
    );
  }

  @override
  Future<List<HorseSexStatus>> getHorsesSexStatus() => secureCallback(
        () => _fetchAllLangValues(
          collectionPath: 'app_data/horses/horses_sex_status',
        ),
      );

  @override
  Future<HorseModel> createHorse({
    required HorseRequest request,
    GLUser? boarder,
    List<File> files = const [],
  }) {
    return secureCallback<HorseModel>(() async {
      final horseId = const Uuid().v4();
      final uploadedDocs = await uploadFilesFromLocal(
        files,
        basePath: 'horses/${request.barnId}/docs/$horseId',
      );

      final data = <String, dynamic>{
        'id': horseId,
        'deleted_at': null,
        ...request.toJson(),
        'documents': uploadedDocs.map((d) => d.toJson()).toList(),
        'search_terms': buildSearchTerms(
          [
            request.name,
            request.breed.code,
            request.sexStatus.code,
            boarder?.name ?? ''
          ],
          excludes: [('_', ' ')],
        ),
        ...creationDates,
      };
      await _horses.doc(horseId).set(data);
      if (request.stallId != null) {
        await _barns.doc(request.barnId).update(
          {'stall_positions.${request.stallId}.horse_id': horseId},
        );
      }
      return HorseModel.fromJson(data);
    });
  }

  @override
  Future<HorseModel> updateHorse({
    required HorseModel horse,
    required HorseRequest request,
    GLUser? boarder,
    List<File> files = const [],
  }) {
    final horseId = horse.id;
    final documentsToDelete = request.documentsToDelete;
    return secureCallback<HorseModel>(() async {
      final uploadedDocs = await uploadFilesFromLocal(
        files,
        basePath: 'horses/${request.barnId}/docs/$horseId',
      );
      if (documentsToDelete.isNotEmpty) {
        for (final doc in documentsToDelete) {
          try {
            await _storage.ref(doc.path).delete();
          } catch (_) {}
        }
      }
      final batch = _firebase.batch();
      final requestJson = request.toJson()..remove('documents_to_delete');
      final documents = horse.documents
          .where((doc) => !documentsToDelete.any((d) => d.path == doc.path))
          .toList();
      final updateData = <String, dynamic>{
        ...requestJson,
        'documents':
            [...documents, ...uploadedDocs].map((e) => e.toJson()).toList(),
        'search_terms': buildSearchTerms(
          [
            request.name,
            request.breed.code,
            request.sexStatus.code,
            boarder?.name ?? '',
          ],
          excludes: [('_', ' ')],
        ),
        'updated_at': FieldValue.serverTimestamp(),
      };
      batch.update(_horses.doc(horseId), updateData);
      final newStallId = request.stallId;
      final oldStallId = horse.stallId;
      if (newStallId != oldStallId) {
        batch.update(
          _barns.doc(request.barnId),
          {
            if (oldStallId != null)
              'stall_positions.$oldStallId.horse_id': null,
            if (newStallId != null)
              'stall_positions.$newStallId.horse_id': horseId,
          },
        );
      }
      await batch.commit();
      final data = {...updateData, 'id': horseId};
      return HorseModel.fromJson(data);
    });
  }

  @override
  Future<void> deleteHorse(
      {required HorseModel horse, required String deletedBy}) {
    return secureCallback(
      () async {
        final batch = _firebase.batch();
        final horseRef = _horses.doc(horse.id);
        batch.update(horseRef, {
          'deleted_at': FieldValue.serverTimestamp(),
        });
        if (horse.stallId != null && horse.barnId.isNotEmpty) {
          final barnRef = _barns.doc(horse.barnId);
          final logId = _uuid.v4();
          batch
            ..update(barnRef, {
              'stall_positions.${horse.stallId}.horse_id': null,
            })
            ..set(_firebase.barnDeleteHorsesLogs(horse.barnId).doc(logId), {
              'id': logId,
              'deleted_at': FieldValue.serverTimestamp(),
              'horse_id': horse.id,
              'deleted_by': deletedBy,
            });
        }

        await batch.commit();
        return null;
      },
    );
  }

  Future<List<LangValue>> _fetchAllLangValues({
    required String collectionPath,
    int pageSize = 25,
  }) async {
    final results = <LangValue>[];
    DocumentSnapshot<Map<String, dynamic>>? lastDoc;

    final base =
        _firebase.collection(collectionPath).orderBy('code').limit(pageSize);

    while (true) {
      final query = (lastDoc == null) ? base : base.startAfterDocument(lastDoc);
      final snap = await query.get();
      if (snap.docs.isEmpty) break;
      for (final d in snap.docs) {
        final data = d.data();
        data['code'] ??= d.id;
        results.add(LangValue.fromJson(data));
      }
      lastDoc = snap.docs.last;
      if (snap.docs.length < pageSize) break;
    }
    return results;
  }

  @override
  Future<List<HorseModel>> fetchBoarderHorses({
    required String barnId,
    required String boarderId,
  }) {
    return secureCallback<List<HorseModel>>(() async {
      final result = <HorseModel>[];
      QueryDocumentSnapshot<Map<String, dynamic>>? lastDoc;

      while (true) {
        var query = _horses
            .where('barn_id', isEqualTo: barnId)
            .where('boarder_id', isEqualTo: boarderId)
            .orderBy('created_at', descending: true)
            .limit(50);
        if (lastDoc != null) {
          query = query.startAfterDocument(lastDoc);
        }
        final snapshot = await query.get();
        if (snapshot.docs.isEmpty) break;
        result.addAll(snapshot.docs.map((e) => HorseModel.fromJson(e.data())));

        lastDoc = snapshot.docs.last;
        if (snapshot.docs.length < 50) break;
      }

      return result;
    });
  }
}
