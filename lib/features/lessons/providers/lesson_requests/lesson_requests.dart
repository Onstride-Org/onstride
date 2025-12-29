import 'package:gl_horses/core/config/dependency_injection/repository/repository_providers.dart';
import 'package:gl_horses/features/lessons/providers/lesson_requests/lesson_requests_state.dart';
import 'package:lessons_repository/lessons_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'lesson_requests.g.dart';

@riverpod
class FetchLessonRequests extends _$FetchLessonRequests {
  LessonsRepository get _repo => ref.read(lessonsRepositoryProvider);

  @override
  FetchLessonRequestsState build() =>
      const FetchLessonRequestsState.initial();

  Future<void> fetchForTrainer({
    required String trainerId,
    required String barnId,
    LessonStatus? statusFilter,
  }) async {
    try {
      state = const FetchLessonRequestsState.loading();
      final requests = await _repo.getTrainerLessonRequests(
        trainerId: trainerId,
        barnId: barnId,
        statusFilter: statusFilter,
      );
      state = FetchLessonRequestsState.success(requests: requests);
    } catch (e) {
      state = FetchLessonRequestsState.error(message: e.toString());
    }
  }

  Future<void> fetchForClient({
    required String clientId,
    required String barnId,
    LessonStatus? statusFilter,
  }) async {
    try {
      state = const FetchLessonRequestsState.loading();
      final requests = await _repo.getClientLessonRequests(
        clientId: clientId,
        barnId: barnId,
        statusFilter: statusFilter,
      );
      state = FetchLessonRequestsState.success(requests: requests);
    } catch (e) {
      state = FetchLessonRequestsState.error(message: e.toString());
    }
  }

  void addRequest(LessonRequestModel request) {
    if (state is SuccessFetchLessonRequestsState) {
      final currentState = state as SuccessFetchLessonRequestsState;
      final updated = [request, ...currentState.requests];
      state = FetchLessonRequestsState.success(requests: updated);
    }
  }

  void updateRequest(LessonRequestModel request) {
    if (state is SuccessFetchLessonRequestsState) {
      final currentState = state as SuccessFetchLessonRequestsState;
      final updated = currentState.requests
          .map((r) => r.id == request.id ? request : r)
          .toList();
      state = FetchLessonRequestsState.success(requests: updated);
    }
  }

  void removeRequest(String requestId) {
    if (state is SuccessFetchLessonRequestsState) {
      final currentState = state as SuccessFetchLessonRequestsState;
      final updated = currentState.requests
          .where((r) => r.id != requestId)
          .toList();
      state = FetchLessonRequestsState.success(requests: updated);
    }
  }
}

@riverpod
class CreateLessonRequest extends _$CreateLessonRequest {
  LessonsRepository get _repo => ref.read(lessonsRepositoryProvider);

  @override
  CreateLessonRequestState build() =>
      const CreateLessonRequestState.initial();

  Future<LessonRequestModel?> create(CreateLessonRequestPayload payload) async {
    try {
      state = const CreateLessonRequestState.loading();
      final request = await _repo.createLessonRequest(payload);
      state = CreateLessonRequestState.success(request: request);
      return request;
    } catch (e) {
      state = CreateLessonRequestState.error(message: e.toString());
      return null;
    }
  }

  void reset() {
    state = const CreateLessonRequestState.initial();
  }
}

@riverpod
class RespondToLessonRequest extends _$RespondToLessonRequest {
  LessonsRepository get _repo => ref.read(lessonsRepositoryProvider);

  @override
  RespondToRequestState build() => const RespondToRequestState.initial();

  Future<LessonRequestModel?> respond({
    required String requestId,
    required String barnId,
    required LessonRequestResponse response,
    required String responderId,
  }) async {
    try {
      state = const RespondToRequestState.loading();
      final updatedRequest = await _repo.respondToLessonRequest(
        requestId: requestId,
        barnId: barnId,
        response: response,
        responderId: responderId,
      );
      state = RespondToRequestState.success(request: updatedRequest);
      return updatedRequest;
    } catch (e) {
      state = RespondToRequestState.error(message: e.toString());
      return null;
    }
  }

  void reset() {
    state = const RespondToRequestState.initial();
  }
}
