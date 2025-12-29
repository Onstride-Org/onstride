import 'package:models/models.dart';

/// {@template task_source}
/// Data source abstraction for managing tasks.
/// Responsible for:
///   - Listing all tasks
///   - Getting a task by id
///   - Creating a task
///   - Updating a task
///   - Deleting a task by id
/// {@endtemplate}
abstract class TasksResource {
  /// {@macro task_source}
  const TasksResource();

  /// Returns a list of tasks for a user based on their role,
  /// and a date (if provided).
  /// - For groomers: filters by groomId and barnId
  /// - For boarders: filters by boarderId
  /// - For owners/managers: filters by barnId only
  Future<List<TaskModel>> getTasksForUser({
    DateTime? date,
    String? groomId,
    String? boarderId,
    String? barnId,
  });

  /// Returns the task with the given [id],
  ///  or throws [NoSuchTaskException] if not found.
  Future<TaskModel> getTask({required String id});

  /// Returns the tasks for the [HorseModel] with the given [id],
  ///  or throws [NoSuchTaskException] if not found.
  Future<List<TaskModel>> getTasksByHorseId({required String horseId});

  /// Creates a new task and returns the created [TaskModel].
  Future<TaskModel> createTask({required TaskModel task});

  /// Updates an existing task by id)
  ///  and returns the updated [TaskModel].
  Future<TaskModel> updateTask({required TaskModel task});

  /// Deletes the task with the given [id].
  ///  Throws [NoSuchTaskException] if not found.
  Future<void> deleteTask({required String id});
}
