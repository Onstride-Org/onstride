// ignore_for_file: avoid_print

import 'dart:convert';

import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:remote_config_client/remote_config_client.dart';

/// {@template firebase_remote_config_client}
/// Firebase Remote Config client
/// {@endtemplate}
class FirebaseRemoteConfigClient implements RemoteConfigClient {
  /// {@macro firebase_remote_config_client}
  FirebaseRemoteConfigClient({
    FirebaseRemoteConfig? remoteConfig,
  }) : _remoteConfig = remoteConfig ?? FirebaseRemoteConfig.instance;

  final FirebaseRemoteConfig _remoteConfig;

  bool _initialized = false;

  @override
  Future<void> initialize() async {
    assert(!_initialized, 'initialize should not be called more than once');

    try {
      final settings = RemoteConfigSettings(
        fetchTimeout: const Duration(minutes: 1),
        minimumFetchInterval: const Duration(hours: 1),
      );
      await _remoteConfig.setDefaults({
        'percent_fee': 0.5,
        'text_scaler': 1.2,
      });
      await _remoteConfig.setConfigSettings(settings);
      await _remoteConfig.fetchAndActivate();
      _initialized = true;
    } catch (err) {
      print(err);
      _initialized = false;
    }
  }

  @override
  double getDouble(String key) {
    assert(_initialized, 'initialize should be called before');

    try {
      return _remoteConfig.getDouble(key);
    } catch (error, stackTrace) {
      throw GetDataFailure(error, stackTrace);
    }
  }

  @override
  int getInt(String key) {
    assert(_initialized, 'initialize should be called before');

    try {
      return _remoteConfig.getInt(key);
    } catch (error, stackTrace) {
      throw GetDataFailure(error, stackTrace);
    }
  }

  @override
  bool getBool(String key) {
    assert(_initialized, 'initialize should be called before');

    try {
      return _remoteConfig.getBool(key);
    } catch (error, stackTrace) {
      throw GetDataFailure(error, stackTrace);
    }
  }

  @override
  String getString(String key) {
    assert(_initialized, 'initialize should be called before');

    try {
      return _remoteConfig.getString(key);
    } catch (error, stackTrace) {
      throw GetDataFailure(error, stackTrace);
    }
  }

  @override
  Map<String, dynamic> getMap(String key) {
    assert(_initialized, 'initialize should be called before');

    try {
      final res = _remoteConfig.getValue(key);
      final decode = jsonDecode(res.asString());
      return decode as Map<String, dynamic>;
    } catch (error, stackTrace) {
      throw GetDataFailure(error, stackTrace);
    }
  }
}
