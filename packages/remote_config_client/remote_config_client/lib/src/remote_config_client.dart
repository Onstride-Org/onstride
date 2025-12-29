/// {@template remote_config_client}
/// Firebase Remote Config client
/// {@endtemplate}

/// {@template remote_config_exception}
/// Exceptions from the remote config client.
/// {@endtemplate}
abstract class RemoteConfigException implements Exception {
  /// {@macro remote_confiremote_config_exceptiong_exception}
  const RemoteConfigException(this.error, this.stackTrace);

  /// The error which was caught.
  final Object error;

  /// The stack trace associated with the [error].
  final StackTrace stackTrace;
}

/// {@template initialization_failure}
/// Thrown during the initialization process if a failure occurs.
/// {@endtemplate}
class InitializationFailure extends RemoteConfigException {
  /// {@macro initialization_failure}
  const InitializationFailure(super.error, super.stackTrace);
}

/// {@template get_value_failure}
/// Thrown during the read data process if a failure occurs.
/// {@endtemplate}
class GetDataFailure extends RemoteConfigException {
  /// {@macro get_data_failure}
  const GetDataFailure(super.error, super.stackTrace);
}

/// A generic Remote Config Interface.
abstract class RemoteConfigClient {
  /// Initializes the client.
  ///
  /// Throws a [InitializationFailure] if an exception occurs.
  Future<void> initialize();

  /// Returns int value associated with given [key].
  ///
  /// Throws a [RemoteConfigException] if an exception occurs.
  int getInt(String key);

  double getDouble(String key);

  /// Returns bool value associated with given [key].
  ///
  /// Throws a [RemoteConfigException] if an exception occurs.
  bool getBool(String key);

  /// Returns String (e.g. JSON) value associated with given [key].
  ///
  /// Throws a [RemoteConfigException] if an exception occurs.
  String getString(String key);

  Map<String, dynamic> getMap(String key);
}
