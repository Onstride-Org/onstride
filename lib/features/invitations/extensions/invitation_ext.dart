import 'package:flutter/foundation.dart';
import 'package:models/models.dart';

extension InvitationExt on Invitation {
  /// Generates the AppsFlyer OneLink deeplink for this invitation.
  /// The app will receive:
  ///   deep_link_value = "invitation"
  ///   deep_link_sub1  = {id}
  Uri deeplink(AppEnvironment env) {
    final parameters = <String, String>{
      'deep_link_value': 'invitation',
      'deep_link_sub1': id,
    };
    const host = 'onstride.onelink.me';
    if (env == AppEnvironment.dev && !kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return Uri.https(host, 'zZLs/rsm32a82', parameters);
    }
    return Uri.https(host, 'S3Lm/a97o3sfz', parameters);
  }
}
