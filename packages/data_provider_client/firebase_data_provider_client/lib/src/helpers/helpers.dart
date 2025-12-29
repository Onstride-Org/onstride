export 'resource_mixin.dart';

// Future<void> _seedHorsesToFirestore(FirebaseFirestore firestore) async {
//   const int kBatchLimit = 500;
//   final horsesCollection = firestore.collection('horses');
//
//   int opsInBatch = 0;
//   WriteBatch batch = firestore.batch();
//
//   Future<void> _commitAndResetBatch() async {
//     await batch.commit();
//     batch = firestore.batch();
//     opsInBatch = 0;
//   }
//
//   for (final horse in seedHorses) {
//     final docRef = horsesCollection.doc(horse.id);
//     final data = horse.toJson();
//
//     // Ensure the doc keeps its id field consistent with document id.
//     data['id'] = horse.id;
//
//     batch.set(docRef, data, SetOptions(merge: true));
//     opsInBatch++;
//
//     if (opsInBatch >= kBatchLimit) {
//       await _commitAndResetBatch();
//     }
//   }
//
//   if (opsInBatch > 0) {
//     await _commitAndResetBatch();
//   }
// }
//
// Future<void> _registerHorsesBreed() async {
//   for (final breed in kHorseBreedCatalog) {
//     final index = kHorseBreedCatalog.indexOf(breed);
//     await _firebase
//         .collection('app_data')
//         .doc('horses')
//         .collection('horses_breed')
//         .doc(breed.code)
//         .set({...breed.toJson(), 'order': index});
//   }
// }
//
// Future<void> _registerHorsesSexStatus() async {
//   for (final sex in kHorseSexStatusCatalog) {
//     final index = kHorseSexStatusCatalog.indexOf(sex);
//     await _firebase
//         .collection('app_data')
//         .doc('horses')
//         .collection('horses_sex_status')
//         .doc(sex.code)
//         .set({...sex.toJson(), 'order': index});
//   }
// }
//
// Future<void> _registerHorseColors() async {
//   for (final color in kHorseColorsCatalog) {
//     final index = kHorseColorsCatalog.indexOf(color);
//     await _firebase
//         .collection('app_data')
//         .doc('horses')
//         .collection('horses_colors')
//         .doc(color.code)
//         .set({...color.toJson(), 'order': index});
//   }
// }
