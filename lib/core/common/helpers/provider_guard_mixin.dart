// lib/core/utils/provider_guard_mixin.dart
import 'dart:developer';

import 'package:data_provider_client/data_provider_client.dart';
import 'package:flutter/foundation.dart';

/// A mixin that provides a safe wrapper for async provider operations.
/// It handles exceptions consistently and forwards them to a custom handler.
mixin ProviderGuardMixin {
  /// Wraps [action] in a try/catch and executes [onException] if a
  /// [DataProviderException] (or generic [Exception]) is thrown.
  ///
  /// Example:
  /// ```dart
  /// await guard(
  ///   () async => _repository.createBarn(ownerId: id, name: name),
  ///   onSuccess: (barn) => state = SetBarnNameState.success(barn: barn),
  ///   onException: (e) => state = SetBarnNameState.error(exception: e),
  ///   onStart: () => state = const SetBarnNameState.loading(),
  /// );
  /// ```
  Future<void> guard<T>({
    required VoidCallback onStart,
    required Future<T> Function() action,
    required void Function(T data) onSuccess,
    required void Function(DataProviderException e) onException,
  }) async {
    try {
      onStart.call();
      final result = await action();
      onSuccess(result);
    } on DataProviderException catch (e) {
      onException(e);
    } catch (e, s) {
      log('Unknown exception $e', error: e, stackTrace: s);
      onException(const UnknownDataProviderException());
    }
  }
}
