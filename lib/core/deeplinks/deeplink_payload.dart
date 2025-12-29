import 'package:flutter/foundation.dart';

@immutable
class DeepLinkPayload {
  const DeepLinkPayload({
    required this.value,
    required this.isDeferred,
    required this.data,
  });

  /// Value from `deep_link_value` param (e.g. "invitation").
  final String value;

  /// True when this deep link comes from a deferred deep link flow.
  final bool isDeferred;

  /// Raw data coming from AppsFlyer deep link payload.
  final Map<String, dynamic> data;
}
