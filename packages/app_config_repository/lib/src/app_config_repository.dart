// ignore_for_file: public_member_api_docs

import 'dart:async';

import 'package:app_config_repository/src/models/models.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:models/models.dart';

/// {@template app_config_repository}
/// Repository which manages determining the current configuration of the app
/// based on remote configurations.
/// {@endtemplate}
class AppConfigRepository {
  /// {@macro app_config_repository}
  AppConfigRepository({
    required this.appEnvironment,
    required int buildNumber,
    FirebaseFirestore? firestore,
  })  : assert(buildNumber > 0, 'buildNumber must be greater than 0'),
        _buildNumber = buildNumber,
        _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;
  final int _buildNumber;

  /// The environment in which the app is running. e.x. production
  final AppEnvironment appEnvironment;

  String get _documentPath => 'global/app_config';

  /// Returns a [Stream<bool>] which indicates whether
  /// the current application status is down for maintenance.
  ///
  /// By default, [isDownForMaintenance] will emit `false`
  /// if unable to connected to the backend.
  Stream<bool> isDownForMaintenance() {
    return _firestore
        .doc(_documentPath)
        .snapshots()
        .map(
          (snapshot) => AppConfig.fromJson(snapshot.data()!).downForMaintenance,
        )
        .transform(
          StreamTransformer.fromHandlers(
            handleError: (_, __, sink) => sink.add(false),
          ),
        );
  }

  /// Returns a [Stream<ForceUpgrade>] which indicates whether
  /// the current application requires a force upgrade.
  Stream<ForceUpgrade> isForceUpgradeRequired() {
    // if (kReleaseMode) {
    if (kIsWeb) {
      return Stream.value(const ForceUpgrade(isUpgradeRequired: false));
    }

    return _firestore.doc(_documentPath).snapshots().map((snapshot) {
      final config = AppConfig.fromJson(snapshot.data()!);
      // For mobile platforms, use defaultTargetPlatform
      final isAndroid = defaultTargetPlatform == TargetPlatform.android;
      final minBuildNumber = isAndroid
          ? config.minAndroidBuildNumber
          : config.minIosBuildNumber;
      final upgradeUrl =
          isAndroid ? config.androidUpgradeUrl : config.iosUpgradeUrl;
      return ForceUpgrade(
        isUpgradeRequired: _buildNumber < minBuildNumber,
        upgradeUrl: upgradeUrl,
      );
    }).transform(
      StreamTransformer.fromHandlers(
        handleError: (_, __, sink) => sink.add(
          const ForceUpgrade(isUpgradeRequired: false),
        ),
      ),
    );
    // } else {
    //   return Stream.value(const ForceUpgrade(isUpgradeRequired: false));
    // }
  }
}
