import 'dart:developer';
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:mime/mime.dart';
import 'package:models/models.dart';
import 'package:path/path.dart' as path;

/// A mixin that provides utilities for secure resource access,
/// network checks, and search term generation.
///
/// - `secureCallback`: Safely executes async operations with error handling.
/// - `hasNetworkConnection`: Verifies basic network availability.
/// - `buildSearchTerms`: Generates incremental prefixes for search queries.
mixin ResourceMixin {
  /// Default limit to page size on firebase queries
  int get defaultLimit => 25;

  /// Limit to whereIn queries
  int get whereInBatchLimit => 10;

  /// Executes the provided [callback] within a secure context.
  ///
  /// This method adds:
  /// - Optional network availability check before execution.
  /// - Exception handling for Firebase-related errors, mapping them into
  ///   domain-specific exceptions.
  /// - A fallback for unknown exceptions wrapped as [UnknownDataProviderException].
  ///
  /// Example:
  /// ```dart
  /// final result = await secureCallback(() => firestore.get());
  /// ```
  ///
  /// Parameters:
  /// - [callback]: The async function to execute.
  /// - [checkConnection]: If true (default), verifies internet connectivity
  ///   before executing the callback.
  ///
  /// Throws:
  /// - [NotNetworkAccessException] when no internet is available.
  /// - A mapped [DataProviderException] for Firebase-specific errors.
  /// - [UnknownDataProviderException] for any other exception.
  Future<T> secureCallback<T extends Object?>(
    Future<T> Function() callback, {
    bool checkConnection = true,
  }) async {
    try {
      if (!checkConnection || await hasNetworkConnection()) {
        return await callback();
      } else {
        throw const NotNetworkAccessException();
      }
    } on FirebaseException catch (e, stackTrace) {
      log(
        'Firebase Exception ${e.message}',
        error: e,
        stackTrace: stackTrace,
      );
      await _reportToCrashlytics(
        error: e,
        stack: stackTrace,
        reason: 'FirebaseException in secureCallback',
        extra: {
          'type': 'FirebaseException',
          'code': e.code,
          'message': e.message,
          'plugin': e.plugin,
          'checkConnection': checkConnection,
        },
      );
      throw _mapFirebaseError(e);
    } on NotNetworkAccessException catch (_) {
      rethrow;
    } on StripeException catch (e, s) {
      log('Stripe Exception $e', error: e, stackTrace: s);
      final code = switch (e.error.code) {
        FailureCode.Failed => PaymentErrorCode.failed,
        FailureCode.Canceled => PaymentErrorCode.canceled,
        FailureCode.Timeout => PaymentErrorCode.timeout,
        FailureCode.Unknown => PaymentErrorCode.unknown,
      };
      throw PaymentException(code, e.error.message);
    } on DataProviderException catch (e, stackTrace) {
      log('Data Provider Exception $e', error: e, stackTrace: stackTrace);

      await _reportToCrashlytics(
        error: e,
        stack: stackTrace,
        reason: 'DataProviderException in secureCallback',
        extra: {
          'type': e.runtimeType.toString(),
          'checkConnection': checkConnection,
        },
      );
      rethrow;
    } on CheckedFromJsonException catch (e, s) {
      await FirebaseCrashlytics.instance.recordError(
        e,
        s,
        reason: 'JSON deserialization error',
        information: [
          'class=${e.className}',
          if (e.key != null) 'key=${e.key}',
          if (e.message != null) 'message=${e.message}',
        ],
      );
      throw DeserializationException(
        className: '${e.className}',
        key: e.key ?? 'unknown',
        message: e.message ?? 'Invalid data',
      );
    } catch (e, stackTrace) {
      log('Unknown exception $e', error: e, stackTrace: stackTrace);
      await _reportToCrashlytics(
        error: e,
        stack: stackTrace,
        reason: 'UnknownException in secureCallback',
        extra: {
          'type': e.runtimeType.toString(),
          'checkConnection': checkConnection,
        },
      );
      throw UnknownDataProviderException(e.toString());
    }
  }

  /// Checks if there is an active network connection.
  ///
  /// Performs a simple DNS lookup (`example.com`) with an optional [timeout].
  /// If the lookup resolves, the device is considered online.
  ///
  /// Example:
  /// ```dart
  /// final online = await hasNetworkConnection();
  /// if (online) {
  ///   print("Device is online");
  /// }
  /// ```
  ///
  /// Returns:
  /// - `true` if the device is connected to the internet.
  /// - `false` otherwise.

  Future<bool> hasNetworkConnection() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return !(connectivityResult.contains(ConnectivityResult.none) ||
        connectivityResult.contains(ConnectivityResult.other));
  }

  /// Generates incremental prefixes for the given [text].
  ///
  /// This is useful for creating Firestore-compatible `search_terms` arrays
  /// to enable prefix-based queries using `arrayContains`.
  ///
  /// Example:
  /// ```dart
  /// final terms = buildSearchTerms("example");
  /// // ["e", "ex", "exa", "exam", "examp", "exampl", "example"]
  /// ```
  ///
  /// Returns:
  /// - A list of lowercase prefixes derived from the input string.
  List<String> buildSearchTerms(
    List<String> terms, {
    List<(String, String)> excludes = const [],
  }) {
    if (terms.isEmpty) return [];
    final results = <String>[];
    for (var term in terms) {
      var token = term.trim().toLowerCase();
      for (final exclude in excludes) {
        if (exclude.$1.isNotEmpty) {
          token = token.replaceAll(exclude.$1.toLowerCase(), exclude.$2);
        }
      }
      if (token.isEmpty) continue;
      results.addAll(
          List.generate(token.length, (i) => token.substring(0, i + 1)));
    }
    return results;
  }

  Map<String, dynamic> get creationDates => {
        'created_at': FieldValue.serverTimestamp(),
        'updated_at': FieldValue.serverTimestamp(),
      };

  /// Uploads or deletes files in Firebase Storage based on [requests].
  /// - If `toDelete` is true: deletes the file at [document.path].
  /// - Else: uploads [bytes] to [document.path] with [contentType] metadata,
  ///         fetches downloadUrl and returns the updated request list.
  ///
  /// Network connectivity and exceptions are handled via [secureCallback].

  /// Uploads files to Firebase Storage and returns a list of GLHorsesDocument.
  ///
  /// Each [FileUploadRequest] must include:
  /// - [path]: storage folder path (e.g. horses/{barnId}/docs/{horseId})
  /// - [name]: file name (e.g. vet_report.pdf)
  /// - [contentType]: MIME type (e.g. application/pdf, image/png)
  /// - [bytes]: file content
  ///
  /// Returns:
  /// - A list of [GLHorsesDocument] with downloadUrl, sizeBytes, and createdAt filled.
  Future<List<GLHorsesDocument>> uploadFilesFromLocal(
    List<File> files, {
    required String basePath,
    FirebaseStorage? storage,
    bool checkConnection = true,
  }) {
    return secureCallback<List<GLHorsesDocument>>(
      () async {
        if (files.isEmpty) return [];

        final _storage = storage ?? FirebaseStorage.instance;
        final result = <GLHorsesDocument>[];

        for (final file in files) {
          final bytes = await file.readAsBytes();
          final name = path.basename(file.path);
          final ext =
              path.extension(file.path).replaceFirst('.', '').toLowerCase();
          final contentType =
              lookupMimeType(file.path) ?? 'application/octet-stream';
          final fullPath = '$basePath/$name';
          final ref = _storage.ref().child(fullPath);

          final metadata = SettableMetadata(
            contentType: contentType,
            customMetadata: {
              'originalName': name,
              'extension': ext,
            },
          );

          final snap = await ref.putData(bytes, metadata);
          final url = await ref.getDownloadURL();

          result.add(
            GLHorsesDocument(
              name: name,
              path: fullPath,
              downloadUrl: url,
              contentType: contentType,
              sizeBytes: snap.totalBytes,
              createdAt: DateTime.now(),
              extension: ext,
            ),
          );
        }

        return result;
      },
      checkConnection: checkConnection,
    );
  }

  /// Deletes files from Firebase Storage based on a list of GLHorsesDocument.
  ///
  /// Ignores not-found/permission errors for idempotency.
  Future<void> deleteFilesFromStorage(
    List<GLHorsesDocument> documents, {
    FirebaseStorage? storage,
    bool checkConnection = true,
  }) {
    return secureCallback<void>(
      () async {
        if (documents.isEmpty) return;
        final _storage = storage ?? FirebaseStorage.instance;
        for (final doc in documents) {
          final ref = _storage.ref().child(doc.path);
          try {
            await ref.delete();
          } catch (_) {}
        }
      },
      checkConnection: checkConnection,
    );
  }

  Future<void> _reportToCrashlytics({
    required Object error,
    required StackTrace stack,
    String? reason,
    String? operation,
    Map<String, Object?> extra = const {},
    bool fatal = false,
  }) async {
    final crash = FirebaseCrashlytics.instance;

    if (operation != null) {
      await crash.setCustomKey('operation', operation);
    }
    for (final entry in extra.entries) {
      final key = entry.key;
      final val = entry.value;
      if (val == null) {
        await crash.setCustomKey(key, 'null');
      } else if (val is num || val is bool || val is String) {
        await crash.setCustomKey(key, val);
      } else {
        await crash.setCustomKey(key, val.toString());
      }
    }

    await crash.recordError(
      error,
      stack,
      reason: reason,
      fatal: fatal,
    );
  }
}

DataProviderException _mapFirebaseError(FirebaseException e) {
  switch (e.code) {
    case 'unauthenticated':
      return const UnauthenticatedException();
    case 'permission-denied':
      return const PermissionDeniedException();
    case 'not-found':
      return const NotFoundException();
    case 'already-exists':
      return const AlreadyExistsException();
    case 'invalid-argument':
      return const InvalidArgumentException(null);
    case 'unavailable':
      return const UnavailableException();
    case 'aborted':
      return const AbortedException();
    case 'resource-exhausted':
      return const ResourceExhaustedException();
    case 'deadline-exceeded':
      return const DeadlineExceededException();
    case 'data-loss':
      return const DataLossException();
    case 'network-error':
    case 'network-request-failed':
      return const NotNetworkAccessException();
    case 'user-disabled':
    case 'user-not-found':
      return const UserNotAvailableException();
    case 'user-already-in-your-barn':
      return const UserAlreadyAssignedInYourBarnException();
    case 'user-already-in-another-barn':
      return const UserAlreadyAssignedInAnotherBarnException();
    case 'failed-precondition':
      return const FailedPreconditionException();
    default:
      return UnknownDataProviderException(e.message);
  }
}
