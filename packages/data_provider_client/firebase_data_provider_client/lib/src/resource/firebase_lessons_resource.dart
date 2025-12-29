import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/helpers/helpers.dart';
import 'package:models/models.dart';

/// {@template firebase_lessons_resource}
/// Firebase-backed resource for managing lessons and lesson requests.
/// {@endtemplate}
class FirebaseLessonsResource with ResourceMixin implements LessonsResource {
  /// {@macro firebase_lessons_resource}
  FirebaseLessonsResource({
    FirebaseFirestore? firebase,
  }) : _firebase = firebase ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firebase;

  CollectionReference<Map<String, dynamic>> _lessonRequests(String barnId) =>
      _firebase.collection('barns').doc(barnId).collection('lesson_requests');

  CollectionReference<Map<String, dynamic>> _lessons(String barnId) =>
      _firebase.collection('barns').doc(barnId).collection('lessons');

  CollectionReference<Map<String, dynamic>> _trainerAvailability(
          String barnId) =>
      _firebase
          .collection('barns')
          .doc(barnId)
          .collection('trainer_availability');

  // ============ LESSON REQUESTS ============

  @override
  Future<LessonRequestModel> createLessonRequest(
      CreateLessonRequestPayload payload) {
    return secureCallback(() async {
      final docRef = _lessonRequests(payload.barnId).doc();
      final now = DateTime.now();

      final request = LessonRequestModel(
        id: docRef.id,
        barnId: payload.barnId,
        trainerId: payload.trainerId,
        clientId: payload.clientId,
        initiatedBy: payload.initiatedBy,
        status: LessonStatus.requested,
        proposedDate: payload.proposedDate,
        proposedDuration: payload.proposedDuration,
        lessonType: payload.lessonType,
        horseId: payload.horseId,
        horseName: payload.horseName,
        trainerName: payload.trainerName,
        clientName: payload.clientName,
        location: payload.location,
        notes: payload.notes,
        price: payload.price,
        createdAt: now,
        updatedAt: now,
      );

      await docRef.set(request.toJson());
      return request;
    });
  }

  @override
  Future<List<LessonRequestModel>> getTrainerLessonRequests({
    required String trainerId,
    required String barnId,
    LessonStatus? statusFilter,
  }) {
    return secureCallback(() async {
      var query = _lessonRequests(barnId)
          .where('trainer_id', isEqualTo: trainerId)
          .where('deleted_at', isNull: true)
          .orderBy('created_at', descending: true);

      if (statusFilter != null) {
        query = query.where('status', isEqualTo: statusFilter.name);
      }

      final snapshot = await query.limit(defaultLimit).get();
      return snapshot.docs
          .map((doc) => LessonRequestModel.fromJson(doc.data()))
          .toList();
    });
  }

  @override
  Future<List<LessonRequestModel>> getClientLessonRequests({
    required String clientId,
    required String barnId,
    LessonStatus? statusFilter,
  }) {
    return secureCallback(() async {
      var query = _lessonRequests(barnId)
          .where('client_id', isEqualTo: clientId)
          .where('deleted_at', isNull: true)
          .orderBy('created_at', descending: true);

      if (statusFilter != null) {
        query = query.where('status', isEqualTo: statusFilter.name);
      }

      final snapshot = await query.limit(defaultLimit).get();
      return snapshot.docs
          .map((doc) => LessonRequestModel.fromJson(doc.data()))
          .toList();
    });
  }

  @override
  Future<LessonRequestModel> getLessonRequest({
    required String id,
    required String barnId,
  }) {
    return secureCallback(() async {
      final doc = await _lessonRequests(barnId).doc(id).get();
      if (!doc.exists) throw const NotFoundException();
      return LessonRequestModel.fromJson(doc.data()!);
    });
  }

  @override
  Future<LessonRequestModel> respondToLessonRequest({
    required String requestId,
    required String barnId,
    required LessonRequestResponse response,
    required String responderId,
  }) {
    return secureCallback(() async {
      final docRef = _lessonRequests(barnId).doc(requestId);
      final doc = await docRef.get();
      if (!doc.exists) throw const NotFoundException();

      final currentRequest = LessonRequestModel.fromJson(doc.data()!);
      final now = DateTime.now();

      LessonRequestModel updatedRequest;

      switch (response.newStatus) {
        case LessonStatus.approved:
          // Create the lesson when approved
          final lessonPayload = CreateLessonPayload(
            barnId: barnId,
            trainerId: currentRequest.trainerId,
            clientId: currentRequest.clientId,
            scheduledDate: currentRequest.effectiveDate,
            durationMinutes: currentRequest.effectiveDuration,
            type: currentRequest.lessonType,
            horseId: currentRequest.horseId,
            horseName: currentRequest.horseName,
            trainerName: currentRequest.trainerName,
            clientName: currentRequest.clientName,
            location: currentRequest.location,
            notes: currentRequest.notes,
            price: currentRequest.price,
            requestId: requestId,
          );
          final lesson = await createLesson(lessonPayload);

          updatedRequest = currentRequest.copyWith(
            status: LessonStatus.approved,
            responseMessage: response.responseMessage,
            respondedAt: now,
            lessonId: lesson.id,
            updatedAt: now,
          );
          break;

        case LessonStatus.rejected:
          updatedRequest = currentRequest.copyWith(
            status: LessonStatus.rejected,
            responseMessage: response.responseMessage,
            rejectionReason: response.responseMessage,
            respondedAt: now,
            updatedAt: now,
          );
          break;

        case LessonStatus.countered:
          updatedRequest = currentRequest.copyWith(
            status: LessonStatus.countered,
            counterProposedDate: response.counterProposedDate,
            counterProposedDuration: response.counterProposedDuration,
            counterNotes: response.counterNotes,
            counterBy: responderId,
            updatedAt: now,
          );
          break;

        default:
          throw const InvalidArgumentException('Invalid response status');
      }

      await docRef.set(updatedRequest.toJson(), SetOptions(merge: true));
      return updatedRequest;
    });
  }

  @override
  Future<void> deleteLessonRequest({
    required String id,
    required String barnId,
    required String deletedBy,
  }) {
    return secureCallback<void>(() async {
      final docRef = _lessonRequests(barnId).doc(id);
      await docRef.update({
        'deleted_at': Timestamp.now(),
        'deleted_by': deletedBy,
      });
    });
  }

  // ============ LESSONS ============

  @override
  Future<LessonModel> createLesson(CreateLessonPayload payload) {
    return secureCallback(() async {
      final docRef = _lessons(payload.barnId).doc();
      final now = DateTime.now();

      final lesson = LessonModel(
        id: docRef.id,
        barnId: payload.barnId,
        trainerId: payload.trainerId,
        clientId: payload.clientId,
        scheduledDate: payload.scheduledDate,
        durationMinutes: payload.durationMinutes,
        type: payload.type,
        status: LessonStatus.approved,
        horseId: payload.horseId,
        horseName: payload.horseName,
        trainerName: payload.trainerName,
        clientName: payload.clientName,
        location: payload.location,
        notes: payload.notes,
        price: payload.price,
        requestId: payload.requestId,
        recurrenceType: payload.recurrenceType,
        recurrenceDays: payload.recurrenceDays,
        recurrenceEndDate: payload.recurrenceEndDate,
        recurrenceCount: payload.recurrenceCount,
        createdAt: now,
        updatedAt: now,
      );

      final data = {
        ...lesson.toJson(),
        'search_terms': buildSearchTerms(payload.searchTerms),
      };

      await docRef.set(data);
      return lesson;
    });
  }

  @override
  Future<List<LessonModel>> getTrainerLessons({
    required String trainerId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  }) {
    return secureCallback(() async {
      var query = _lessons(barnId)
          .where('trainer_id', isEqualTo: trainerId)
          .where('deleted_at', isNull: true)
          .orderBy('scheduled_date', descending: false);

      if (startDate != null) {
        query = query.where('scheduled_date',
            isGreaterThanOrEqualTo: Timestamp.fromDate(startDate));
      }
      if (endDate != null) {
        query = query.where('scheduled_date',
            isLessThanOrEqualTo: Timestamp.fromDate(endDate));
      }
      if (statusFilter != null) {
        query = query.where('status', isEqualTo: statusFilter.name);
      }

      final snapshot = await query.limit(defaultLimit).get();
      return snapshot.docs
          .map((doc) => LessonModel.fromJson(doc.data()))
          .toList();
    });
  }

  @override
  Future<List<LessonModel>> getClientLessons({
    required String clientId,
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  }) {
    return secureCallback(() async {
      var query = _lessons(barnId)
          .where('client_id', isEqualTo: clientId)
          .where('deleted_at', isNull: true)
          .orderBy('scheduled_date', descending: false);

      if (startDate != null) {
        query = query.where('scheduled_date',
            isGreaterThanOrEqualTo: Timestamp.fromDate(startDate));
      }
      if (endDate != null) {
        query = query.where('scheduled_date',
            isLessThanOrEqualTo: Timestamp.fromDate(endDate));
      }
      if (statusFilter != null) {
        query = query.where('status', isEqualTo: statusFilter.name);
      }

      final snapshot = await query.limit(defaultLimit).get();
      return snapshot.docs
          .map((doc) => LessonModel.fromJson(doc.data()))
          .toList();
    });
  }

  @override
  Future<List<LessonModel>> getBarnLessons({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    LessonStatus? statusFilter,
  }) {
    return secureCallback(() async {
      var query = _lessons(barnId)
          .where('deleted_at', isNull: true)
          .orderBy('scheduled_date', descending: false);

      if (startDate != null) {
        query = query.where('scheduled_date',
            isGreaterThanOrEqualTo: Timestamp.fromDate(startDate));
      }
      if (endDate != null) {
        query = query.where('scheduled_date',
            isLessThanOrEqualTo: Timestamp.fromDate(endDate));
      }
      if (statusFilter != null) {
        query = query.where('status', isEqualTo: statusFilter.name);
      }

      final snapshot = await query.limit(defaultLimit).get();
      return snapshot.docs
          .map((doc) => LessonModel.fromJson(doc.data()))
          .toList();
    });
  }

  @override
  Future<LessonModel> getLesson({
    required String id,
    required String barnId,
  }) {
    return secureCallback(() async {
      final doc = await _lessons(barnId).doc(id).get();
      if (!doc.exists) throw const NotFoundException();
      return LessonModel.fromJson(doc.data()!);
    });
  }

  @override
  Future<LessonModel> updateLesson({required LessonModel lesson}) {
    return secureCallback(() async {
      final docRef = _lessons(lesson.barnId).doc(lesson.id);
      final updatedLesson = lesson.copyWith(updatedAt: DateTime.now());
      await docRef.set(updatedLesson.toJson(), SetOptions(merge: true));
      return updatedLesson;
    });
  }

  @override
  Future<LessonModel> cancelLesson({
    required String id,
    required String barnId,
    required String cancelledBy,
    String? reason,
  }) {
    return secureCallback(() async {
      final docRef = _lessons(barnId).doc(id);
      final doc = await docRef.get();
      if (!doc.exists) throw const NotFoundException();

      final lesson = LessonModel.fromJson(doc.data()!);
      final updatedLesson = lesson.copyWith(
        status: LessonStatus.cancelled,
        cancellationReason: reason,
        updatedAt: DateTime.now(),
      );

      await docRef.set(updatedLesson.toJson(), SetOptions(merge: true));
      return updatedLesson;
    });
  }

  @override
  Future<LessonModel> completeLesson({
    required String id,
    required String barnId,
  }) {
    return secureCallback(() async {
      final docRef = _lessons(barnId).doc(id);
      final doc = await docRef.get();
      if (!doc.exists) throw const NotFoundException();

      final lesson = LessonModel.fromJson(doc.data()!);
      final updatedLesson = lesson.copyWith(
        status: LessonStatus.completed,
        updatedAt: DateTime.now(),
      );

      await docRef.set(updatedLesson.toJson(), SetOptions(merge: true));
      return updatedLesson;
    });
  }

  @override
  Future<void> deleteLesson({
    required String id,
    required String barnId,
    required String deletedBy,
  }) {
    return secureCallback<void>(() async {
      await _lessons(barnId).doc(id).update({
        'deleted_at': Timestamp.now(),
        'deleted_by': deletedBy,
      });
    });
  }

  // ============ TRAINER AVAILABILITY ============

  @override
  Future<TrainerAvailability?> getTrainerAvailability({
    required String trainerId,
    required String barnId,
  }) {
    return secureCallback(() async {
      final doc = await _trainerAvailability(barnId).doc(trainerId).get();
      if (!doc.exists) return null;
      return TrainerAvailability.fromJson(doc.data()!);
    });
  }

  @override
  Future<TrainerAvailability> saveTrainerAvailability(
      TrainerAvailability availability) {
    return secureCallback(() async {
      final docRef =
          _trainerAvailability(availability.barnId).doc(availability.trainerId);
      final now = DateTime.now();

      final updated = availability.copyWith(
        id: availability.trainerId,
        updatedAt: now,
        createdAt: availability.createdAt,
      );

      await docRef.set(updated.toJson(), SetOptions(merge: true));
      return updated;
    });
  }

  // ============ RECURRING LESSONS ============

  @override
  Future<List<LessonModel>> getRecurringTemplates({
    required String trainerId,
    required String barnId,
  }) {
    return secureCallback(() async {
      final snapshot = await _lessons(barnId)
          .where('trainer_id', isEqualTo: trainerId)
          .where('recurrence_type', isNotEqualTo: null)
          .where('deleted_at', isNull: true)
          .get();

      return snapshot.docs
          .map((doc) => LessonModel.fromJson(doc.data()))
          .where((l) => l.recurrenceType != null && l.recurrenceType!.isRecurring)
          .toList();
    });
  }

  @override
  Future<List<LessonModel>> generateRecurringInstances({
    required String templateId,
    required String barnId,
    required DateTime untilDate,
  }) {
    return secureCallback(() async {
      final templateDoc = await _lessons(barnId).doc(templateId).get();
      if (!templateDoc.exists) throw const NotFoundException();

      final template = LessonModel.fromJson(templateDoc.data()!);
      if (template.recurrenceType == null || !template.recurrenceType!.isRecurring) {
        throw const InvalidArgumentException('Lesson is not a recurring template');
      }

      final instances = <LessonModel>[];
      var currentDate = template.scheduledDate;
      var count = 0;
      final maxCount = template.recurrenceCount ?? 52; // Default max 1 year weekly

      while (currentDate.isBefore(untilDate) && count < maxCount) {
        if (template.recurrenceEndDate != null &&
            currentDate.isAfter(template.recurrenceEndDate!)) {
          break;
        }

        // Skip the template's original date
        if (count > 0) {
          final instancePayload = CreateLessonPayload(
            barnId: barnId,
            trainerId: template.trainerId,
            clientId: template.clientId,
            scheduledDate: currentDate,
            durationMinutes: template.durationMinutes,
            type: template.type,
            horseId: template.horseId,
            horseName: template.horseName,
            trainerName: template.trainerName,
            clientName: template.clientName,
            location: template.location,
            notes: template.notes,
            price: template.price,
          );

          final instance = await createLesson(instancePayload);
          instances.add(instance);
        }

        // Calculate next date based on recurrence type
        switch (template.recurrenceType!) {
          case RecurrenceType.daily:
            currentDate = currentDate.add(const Duration(days: 1));
            break;
          case RecurrenceType.weekly:
            currentDate = currentDate.add(const Duration(days: 7));
            break;
          case RecurrenceType.biweekly:
            currentDate = currentDate.add(const Duration(days: 14));
            break;
          case RecurrenceType.monthly:
            currentDate = DateTime(
              currentDate.year,
              currentDate.month + 1,
              currentDate.day,
              currentDate.hour,
              currentDate.minute,
            );
            break;
          case RecurrenceType.custom:
          case RecurrenceType.none:
            break;
        }

        count++;
      }

      return instances;
    });
  }
}
