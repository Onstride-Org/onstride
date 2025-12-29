import 'dart:async';
import 'dart:io';

import 'package:equatable/equatable.dart';

/// {@template storage_exception}
/// Exceptions from the storage client.
/// {@endtemplate}
abstract class StorageException with EquatableMixin implements Exception {
  /// {@macro storage_exception}
  const StorageException(this.error, this.stackTrace);

  /// The error which was caught.
  final Object error;

  /// The stack trace associated with the [error].
  final StackTrace stackTrace;

  @override
  List<Object?> get props => [error, stackTrace];
}

/// {@template upload_failure}
/// Exceptions from the storage client when uploading file
/// {@endtemplate}
class UploadFailure extends StorageException {
  /// {@macro upload_failure}
  const UploadFailure(super.error, super.stackTrace);
}

/// {@template delete_failure}
/// Exceptions from the storage client when deleting file
/// {@endtemplate}
class DeleteFailure extends StorageException {
  /// {@macro delete_failure}
  const DeleteFailure(super.error, super.stackTrace);
}

/// A generic Storage Client Interface.
abstract class StorageClient {
  /// Uploads file to corresponding [bucket]. Returns download URl
  ///
  /// Throws a [StorageException] if an exception occurs.
  Future<String> upload({
    required File file,
    required String bucket,
  });

  /// Deletes file to corresponding [filePath].
  ///
  /// Throws a [StorageException] if an exception occurs.
  Future<void> delete({
    required String filePath,
  });
}
