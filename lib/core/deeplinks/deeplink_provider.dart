import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'deeplink_payload.dart';

/// Holds the last deep link payload received from AppsFlyer.
/// When `state` is null there is no pending deep link to handle.
final deepLinkProvider = StateProvider<DeepLinkPayload?>(
  (ref) => null,
);
