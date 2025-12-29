import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/common/services/push_notifications_service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'push_notifications_provider.g.dart';

@Riverpod(keepAlive: true)
PushNotificationsService pushNotificationsService(
  Ref ref,
) {
  return PushNotificationsService();
}
