import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:models/models.dart';

final Provider<FlavorConfig> flavorConfigProvider = Provider<FlavorConfig>(
  (Ref<FlavorConfig> ref) => throw UnimplementedError(),
);

class FlavorConfig {
  FlavorConfig({
    required this.appEnvironment,
    required this.name,
    required this.stripePublishableKey,
    this.buildNumber,
    this.version,
    this.isTest = false,
  }) {}

  // required this.apiUrl,);
  AppEnvironment appEnvironment;

  //String apiUrl;
  String name;
  bool isTest;
  int? buildNumber;
  String? version;
  final String stripePublishableKey;

  FlavorConfig copyWith({
    AppEnvironment? appEnvironment,
    bool? isTest,
    String? name,
    String? version,
    String? stripePublishableKey,
    int? buildNumber,
    ThemeData? theme,
  }) => FlavorConfig(
    stripePublishableKey: stripePublishableKey ?? this.stripePublishableKey,
    isTest: isTest ?? this.isTest,
    appEnvironment: appEnvironment ?? this.appEnvironment,
    name: name ?? this.name,
    buildNumber: buildNumber ?? this.buildNumber,
    version: version ?? this.version,
    //   apiUrl: apiUrl ?? this.apiUrl,
  );
}
