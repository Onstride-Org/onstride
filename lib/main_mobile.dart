import 'dart:developer';

import 'package:appsflyer_sdk/appsflyer_sdk.dart';
import 'package:flutter_displaymode/flutter_displaymode.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';

final AppsFlyerOptions _options = AppsFlyerOptions(
  afDevKey: 'jPxCdgKBwUvC8i3YEUb3fV',
  appId: '6752926080',
  showDebug: true,
);

final AppsflyerSdk _afSdk = AppsflyerSdk(_options);

Future<void> setHighRefreshRate() async {
  await FlutterDisplayMode.setHighRefreshRate();
}

Future<void> setupAppsFlyer(ProviderContainer container) async {
  await _afSdk.initSdk(
    registerConversionDataCallback: true,
    registerOnDeepLinkingCallback: true,
    registerOnAppOpenAttributionCallback: true,
  );

  _afSdk
    ..onDeepLinking((DeepLinkResult result) {
      final deepLink = result.deepLink;
      if (deepLink == null) {
        return;
      }
      final value = deepLink.deepLinkValue ?? '';
      if (value.isEmpty) {
        return;
      }

      log('Deeplink - clickEvent :${deepLink.clickEvent['deep_link_sub1']}');
      for (final e in deepLink.clickEvent.entries) {
        log('Click event ${e.key}: ${e.value}');
      }
      final payload = DeepLinkPayload(
        value: value,
        isDeferred: deepLink.isDeferred ?? false,
        data: {
          'deep_link_value': deepLink.deepLinkValue,
          'deep_link_sub1': deepLink.clickEvent['deep_link_sub1'],
        },
      );

      container.read(deepLinkProvider.notifier).state = payload;
    })
    ..onInstallConversionData((dynamic data) {
      log('Install Conversion Data: ${data.runtimeType}');
      for (final e in (data as Map).entries) {
        log('Conversion Data ${e.key}: ${e.value}');
      }
      final deepLinkValue = data['deep_link_value'] as String?;
      if (deepLinkValue != null && deepLinkValue.isNotEmpty) {
        final payload = DeepLinkPayload(
          value: deepLinkValue,
          isDeferred: true,
          data: Map<String, dynamic>.from(data as Map),
        );
        container.read(deepLinkProvider.notifier).state = payload;
      }
    });
}
