import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';
import 'package:rxdart/rxdart.dart';

/// A generic Tasks Client Interface.
class TasksRepository {
  TasksRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  BehaviorSubject<List<TaskModel>>? _tasksStream;
  final Map<String, BehaviorSubject<TaskModel>> _taskStreams = {};
  List<TaskModel> _lastTasksSnapshot = const [];

  Stream<List<TaskModel>> getTasks() {
    _tasksStream ??= BehaviorSubject<List<TaskModel>>();
    fetchAndUpdateTasks();
    return _tasksStream!.stream;
  }

  Stream<TaskModel> getTaskStream(String id) {
    if (_taskStreams[id] == null) {
      _taskStreams[id] = BehaviorSubject<TaskModel>();
      fetchAndUpdateTask(id: id);
    }
    return _taskStreams[id]!.stream;
  }

  Future<List<TaskModel>> fetchAndUpdateTasks({
    DateTime? date,
    String? groomId,
    String? boarderId,
    String? barnId,
  }) async {
    try {
      List<TaskModel> tasks;

      tasks = await dataProviderClient.tasksResource.getTasksForUser(
        date: date,
        groomId: groomId,
        boarderId: boarderId,
        barnId: barnId,
      );

      _lastTasksSnapshot = tasks;
      _tasksStream?.add(tasks);
      for (final task in tasks) {
        _taskStreams[task.id]?.add(task);
      }
      return tasks;
    } catch (e) {
      _tasksStream?.addError(e);
      print(e);
      rethrow;
    }
  }

  Future<TaskModel> fetchAndUpdateTask({required String id}) async {
    try {
      final task = await dataProviderClient.tasksResource.getTask(id: id);
      _taskStreams[id]?.add(task);
      final idx = _lastTasksSnapshot.indexWhere((t) => t.id == id);
      if (idx >= 0) {
        final updated = [..._lastTasksSnapshot];
        updated[idx] = task;
        _lastTasksSnapshot = updated;
        _tasksStream?.add(updated);
      }
      return task;
    } catch (e) {
      _taskStreams[id]?.addError(e);
      rethrow;
    }
  }

  Future<List<TaskModel>> fetchAndUpdateTasksByHorseId({
    required String horseId,
    DateTime? date,
  }) async {
    try {
      final tasks = await dataProviderClient.tasksResource.getTasksByHorseId(
        horseId: horseId,
      );
      _lastTasksSnapshot = tasks;
      _tasksStream?.add(tasks);
      for (final task in tasks) {
        _taskStreams[task.id]?.add(task);
      }
      return tasks;
    } catch (e) {
      _tasksStream?.addError(e);
      rethrow;
    }
  }

  Future<TaskModel> createTask({required TaskModel task}) async {
    final created = await dataProviderClient.tasksResource.createTask(
      task: task,
    );
    _taskStreams[created.id]?.add(created);
    final updated = [..._lastTasksSnapshot, created];
    _lastTasksSnapshot = updated;
    _tasksStream?.add(updated);
    return created;
  }

  Future<TaskModel> updateTask({required TaskModel task}) async {
    final updatedTask = await dataProviderClient.tasksResource.updateTask(
      task: task,
    );
    _taskStreams[updatedTask.id]?.add(updatedTask);
    final idx = _lastTasksSnapshot.indexWhere((t) => t.id == updatedTask.id);
    if (idx >= 0) {
      final updated = [..._lastTasksSnapshot];
      updated[idx] = updatedTask;
      _lastTasksSnapshot = updated;
      _tasksStream?.add(updated);
    } else {
      final appended = [..._lastTasksSnapshot, updatedTask];
      _lastTasksSnapshot = appended;
      _tasksStream?.add(appended);
    }
    return updatedTask;
  }

  Future<void> deleteTask({required String id}) async {
    await dataProviderClient.tasksResource.deleteTask(id: id);
    await _taskStreams[id]?.close();
    _taskStreams.remove(id);
    final updated = _lastTasksSnapshot
        .where((t) => t.id != id)
        .toList(growable: false);
    _lastTasksSnapshot = updated;
    _tasksStream?.add(updated);
  }

  void dispose() {
    _tasksStream?.close();
    for (final s in _taskStreams.values) {
      s.close();
    }
    _taskStreams.clear();
  }
}
