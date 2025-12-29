import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:models/models.dart';

/// {@template tasks_resource}
/// Firebase-backed resource for managing tasks in the "tasks" collection.
/// {@endtemplate}
class FirebaseTasksResource with ResourceMixin implements TasksResource {
  /// {@macro tasks_resource}
  FirebaseTasksResource({
    FirebaseFirestore? firebase,
  }) : _firebase = firebase ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firebase;

  @override
  Future<List<TaskModel>> getTasksForUser({
    DateTime? date,
    String? groomId,
    String? boarderId,
    String? barnId,
  }) async {
    return secureCallback(
      () async {
        final collection = _firebase.collection('tasks');
        var query = collection.where('deleted_at', isNull: true);
        if (groomId != null) {
          query = query.where('groom_id', isEqualTo: groomId);
          if (barnId != null) {
            query = query.where('barn_id', isEqualTo: barnId);
          }
        } else if (boarderId != null) {
          query = query.where('boarder_id', isEqualTo: boarderId);
        } else {
          if (barnId != null) {
            query = query.where('barn_id', isEqualTo: barnId);
          }
        }
        if (date != null) {
          final startOfMonth = DateTime(date.year, date.month).toUtc();
          final endOfMonth = DateTime(date.year, date.month + 1).toUtc();
          query = query
              .where(
                'due_date',
                isGreaterThanOrEqualTo: startOfMonth.toIso8601String(),
              )
              .where(
                'due_date',
                isLessThan: endOfMonth.toIso8601String(),
              );
        }

        final snapshot = await query.get();
        return snapshot.docs
            .map((doc) => TaskModel.fromJson(doc.data()))
            .toList();
      },
    );
  }

  @override
  Future<TaskModel> getTask({required String id}) async {
    return secureCallback(
      () async {
        final doc = await _firebase.collection('tasks').doc(id).get();
        if (!doc.exists) {
          throw const NotFoundException();
        }
        return TaskModel.fromJson(doc.data()!);
      },
    );
  }

  @override
  Future<List<TaskModel>> getTasksByHorseId({
    required String horseId,
  }) async {
    return secureCallback(
      () async {
        final collection = _firebase.collection('tasks');
        final snapshot = await collection
            .where('horse_id', isEqualTo: horseId)
            .orderBy('due_date')
            .limit(defaultLimit)
            .get();
        return snapshot.docs
            .map((doc) => TaskModel.fromJson(doc.data()))
            .toList();
      },
    );
  }

  @override
  Future<TaskModel> createTask({required TaskModel task}) async {
    final docRef = _firebase.collection('tasks').doc();
    final newTask = task.copyWith(id: docRef.id);
    await docRef.set(newTask.toJson());
    return newTask;
  }

  @override
  Future<TaskModel> updateTask({required TaskModel task}) async {
    return secureCallback(
      () async {
        final docRef = _firebase.collection('tasks').doc(task.id);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }
        await docRef.set(task.toJson(), SetOptions(merge: true));
        final updatedDoc = await docRef.get();
        return TaskModel.fromJson(updatedDoc.data()!);
      },
    );
  }

  @override
  Future<void> deleteTask({required String id}) async {
    return secureCallback<void>(
      () async {
        final docRef = _firebase.collection('tasks').doc(id);
        final doc = await docRef.get();
        if (!doc.exists) {
          throw const NotFoundException();
        }
        await docRef.delete();
      },
    );
  }
}
