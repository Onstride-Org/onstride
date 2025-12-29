// push_notifications_service.dart
import 'dart:async';
import 'dart:convert';
import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/providers/notification_navigation/notification_navigation_provider.dart';
import 'package:models/models.dart';

/// Push notification service:
/// - Requests permission
/// - Shows local notifications for foreground FCM messages
/// - Dispatches typed navigation intents (Task / Invoice) on taps
/// - Persists debug logs into Firestore (collection: `logs`)
class PushNotificationsService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  ProviderContainer? _container;

  /// Initialize FCM + local notifications handling.
  Future<void> initialize({ProviderContainer? container}) async {
    _container = container;
    await _requestPermissions();
    await _configureLocalNotifications();
    await _configureForegroundNotifications();
    await _configureBackgroundNotifications();
  }

  Future<NotificationSettings> _requestPermissions() {
    return _firebaseMessaging.requestPermission(criticalAlert: true);
  }

  Future<void> _configureLocalNotifications() async {
    const android = AndroidInitializationSettings('@drawable/ic_notification');
    const ios = DarwinInitializationSettings();
    const settings = InitializationSettings(android: android, iOS: ios);

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _handleLocalNotificationTap,
    );

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      const channel = AndroidNotificationChannel(
        'on_stride_notifications',
        'On Stride Notifications',
        description: 'This channel is used for On Stride app notifications.',
        importance: Importance.max,
      );
      await _localNotifications
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >()
          ?.createNotificationChannel(channel);
    }
  }

  Future<void> _configureForegroundNotifications() async {
    FirebaseMessaging.onMessage.listen(_showLocalNotification);
  }

  Future<void> _configureBackgroundNotifications() async {
    FirebaseMessaging.onMessageOpenedApp.listen(_handleFcmTap);
  }

  // ---------------------------------------------------------------------------
  // Firestore logging helpers
  // ---------------------------------------------------------------------------

  /// Persist a structured log event into Firestore (`logs` collection).
  /// Logging must never break the core flow.
  Future<void> _logEvent(
    String event, {
    String level = 'info',
    Map<String, dynamic>? data,
  }) async {
    try {
      final uid = _auth.currentUser?.uid;
      final platform = kIsWeb ? 'web' : defaultTargetPlatform.name;
      final payload = <String, dynamic>{
        'event': event,
        'level': level,
        'uid': uid,
        'platform': platform,
        'ts': FieldValue.serverTimestamp(),
        'data': _shrink(data),
        'source': 'push_notifications_service',
      };
      await _firestore.collection('logs').add(payload);
    } catch (_) {
      // Never throw: logging must not impact UX
    }
  }

  /// Shrink payloads to avoid oversized writes (keep strings/maps concise).
  Map<String, dynamic>? _shrink(Map<String, dynamic>? input) {
    if (input == null) return null;
    final out = <String, dynamic>{};
    input.forEach((k, v) {
      if (v == null) return;
      if (v is String) {
        out[k] = v.length > 200 ? '${v.substring(0, 200)}…' : v;
      } else if (v is num || v is bool) {
        out[k] = v;
      } else if (v is Map) {
        out[k] = _shrink(
          v.map((kk, vv) => MapEntry(kk.toString(), vv)),
        );
      } else if (v is List) {
        final short = v.take(5).toList();
        out[k] = short
            .map(
              (e) => e is Map
                  ? _shrink(Map<String, dynamic>.from(e as Map))
                  : e.toString(),
            )
            .toList();
        if (v.length > 5) out['${k}_truncated'] = true;
      } else {
        out[k] = v.toString();
      }
    });
    return out;
  }

  // ---------------------------------------------------------------------------
  // Typed dispatch
  // ---------------------------------------------------------------------------

  /// Dispatch typed navigation intent to NotificationNavigation provider.
  void _dispatch(NotificationData data) {
    final container = _container;
    if (container == null) return;

    _logEvent(
      'dispatch.begin',
      data: {
        'variant': data.map(
          task: (_) => 'task',
          invoice: (_) => 'invoice',
        ),
        // Requires NotificationData.toPayloadMap() in your models
        'payload': data.toPayloadMap(),
      },
    );

    final nav = container.read(notificationNavigationProvider.notifier);

    data.when(
      task: (taskId, dueDate) {
        final when = dueDate ?? DateTime.now();
        nav.handleTaskTap(taskId, when);
        _logEvent(
          'dispatch.task.sent',
          data: {
            'taskId': taskId,
            'dueDate': when.toIso8601String(),
          },
        );
      },
      invoice: (invoiceId, barnId) {
        nav.handleInvoiceTap(invoiceId, barnId);
        _logEvent(
          'dispatch.invoice.sent',
          data: {
            'invoiceId': invoiceId,
            'barnId': barnId,
          },
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // FCM / Local handlers (taps)
  // ---------------------------------------------------------------------------

  void _handleFcmTap(RemoteMessage message) {
    _logEvent(
      'tap.fcm',
      data: {
        'rawKeys': message.data.keys.toList(),
        'data': message.data,
        'hasNotification': message.notification != null,
      },
    );

    final typed = NotificationData.fromMap(message.data);
    if (typed != null) {
      _logEvent('tap.fcm.parsed', data: typed.toPayloadMap());
      _dispatch(typed);
      return;
    }

    // Back-compat: legacy task-only payload
    final taskId = message.data['taskId']?.toString();
    final dueDateStr = message.data['dueDate']?.toString();
    _logEvent(
      'tap.fcm.legacy',
      data: {'taskId': taskId, 'dueDate': dueDateStr},
    );

    DateTime? due;
    if (dueDateStr != null && dueDateStr.isNotEmpty) {
      try {
        due = DateTime.parse(dueDateStr);
      } catch (e) {
        _logEvent(
          'tap.fcm.legacy.parseError',
          level: 'warn',
          data: {'error': e.toString()},
        );
      }
    }
    if (taskId != null && taskId.isNotEmpty) {
      _dispatch(NotificationData.task(taskId: taskId, dueDate: due));
    }
  }

  void _handleLocalNotificationTap(NotificationResponse response) {
    _logEvent(
      'tap.local',
      data: {
        'payloadLen': response.payload?.length,
      },
    );

    final typed = NotificationData.fromPayloadJson(response.payload);
    if (typed != null) {
      _logEvent('tap.local.parsed', data: typed.toPayloadMap());
      _dispatch(typed);
      return;
    }

    // Back-compat: legacy payloads
    if (response.payload != null) {
      try {
        final raw = jsonDecode(response.payload!) as Map<String, dynamic>;
        _logEvent('tap.local.legacy', data: {'raw': raw});
        final taskId = raw['taskId']?.toString();
        final dueDateStr = raw['dueDate']?.toString();
        DateTime? due;
        if (dueDateStr != null && dueDateStr.isNotEmpty) {
          try {
            due = DateTime.parse(dueDateStr);
          } catch (e) {
            _logEvent(
              'tap.local.legacy.parseError',
              level: 'warn',
              data: {'error': e.toString()},
            );
          }
        }
        if (taskId != null && taskId.isNotEmpty) {
          _dispatch(NotificationData.task(taskId: taskId, dueDate: due));
        }
      } catch (e) {
        _logEvent(
          'tap.local.payload.decodeError',
          level: 'error',
          data: {'error': e.toString()},
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Foreground: show local notification
  // ---------------------------------------------------------------------------

  Future<void> _showLocalNotification(RemoteMessage message) async {
    _logEvent(
      'foreground.message',
      data: {
        'hasNotification': message.notification != null,
        'data': message.data,
      },
    );

    String title, body;
    if (message.notification != null) {
      title = message.notification!.title ?? 'Notification';
      body = message.notification!.body ?? 'You have a new notification';
    } else {
      title = (message.data['title'] as String?) ?? 'Notification';
      body = (message.data['body'] as String?) ?? 'You have a new notification';
    }

    // Always serialize a typed payload for consistency on tap
    final typed =
        NotificationData.fromMap(message.data) ?? _fallbackFromMessage(message);
    final payload = typed.toPayloadJson();

    const android = AndroidNotificationDetails(
      'on_stride_notifications',
      'On Stride Notifications',
      channelDescription:
          'This channel is used for On Stride app notifications.',
      importance: Importance.max,
      icon: '@drawable/ic_notification',
      color: Color(0xFF405D4B),
      enableLights: true,
    );
    const ios = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
      presentBanner: true,
      presentList: true,
    );

    await _localNotifications.show(
      message.hashCode,
      title,
      body,
      const NotificationDetails(android: android, iOS: ios),
      payload: payload,
    );

    _logEvent(
      'foreground.localShown',
      data: {
        'typed': typed.toPayloadMap(),
      },
    );
  }

  // Back-compat: infer a Task when no typed payload is available
  NotificationData _fallbackFromMessage(RemoteMessage message) {
    final taskId = message.data['taskId']?.toString();
    final dueDateStr = message.data['dueDate']?.toString();
    DateTime? due;
    if (dueDateStr != null && dueDateStr.isNotEmpty) {
      try {
        due = DateTime.parse(dueDateStr);
      } catch (_) {}
    }
    if (taskId != null && taskId.isNotEmpty) {
      return NotificationData.task(taskId: taskId, dueDate: due);
    }
    // Default to a benign invoice (won't navigate if empty)
    return const NotificationData.invoice(invoiceId: '', barnId: '');
  }

  // ---------------------------------------------------------------------------
  // Token helpers
  // ---------------------------------------------------------------------------

  Future<String?> getToken() => _firebaseMessaging.getToken();

  Future<void> deleteToken() => _firebaseMessaging.deleteToken();

  Future<void> setFCMTokenToNull() async {
    try {
      final user = _auth.currentUser;
      if (user != null) {
        await _firestore.collection('users').doc(user.uid).update({
          'fcm_token': null,
        });
      }
      await deleteToken();
    } catch (e, s) {
      log('setFCMTokenToNull $e', error: e, stackTrace: s);
    }
  }

  Future<void> saveFCMCurrentToken() async {
    final settings = await _firebaseMessaging.getNotificationSettings();
    if (settings.authorizationStatus != AuthorizationStatus.authorized &&
        settings.authorizationStatus != AuthorizationStatus.provisional) {
      return;
    }

    final token = await _firebaseMessaging.getToken();
    final user = _auth.currentUser;
    if (token != null && user != null) {
      await _firestore.collection('users').doc(user.uid).update({
        'fcm_token': token,
      });

      _firebaseMessaging.onTokenRefresh.listen((refreshedToken) async {
        final u = _auth.currentUser;
        if (u != null) {
          await _firestore.collection('users').doc(u.uid).update({
            'fcm_token': refreshedToken,
          });
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Initial notification (cold start)
  // ---------------------------------------------------------------------------

  Future<void> checkInitialNotificationDetails({
    ProviderContainer? container,
  }) async {
    final containerToUse = container ?? _container;
    if (containerToUse == null) return;

    _logEvent(
      'coldstart.begin',
      data: {'hasContainer': containerToUse != null},
    );

    try {
      // FCM cold start
      final initial = await _firebaseMessaging.getInitialMessage();
      _logEvent(
        'coldstart.fcmInitial',
        data: {
          'hasInitial': initial != null,
          if (initial != null) 'data': initial.data,
        },
      );

      if (initial != null) {
        final typed = NotificationData.fromMap(initial.data);
        if (typed != null) {
          await Future<void>.delayed(const Duration(milliseconds: 1500));
          _logEvent(
            'coldstart.fcmInitial.dispatch',
            data: typed.toPayloadMap(),
          );
          _dispatch(typed);
          return;
        }
        // Back-compat: task-only
        final taskId = initial.data['taskId']?.toString();
        final dueDateStr = initial.data['dueDate']?.toString();
        _logEvent(
          'coldstart.fcmInitial.legacy',
          data: {'taskId': taskId, 'dueDate': dueDateStr},
        );

        DateTime? due;
        if (dueDateStr != null && dueDateStr.isNotEmpty) {
          try {
            due = DateTime.parse(dueDateStr);
          } catch (_) {}
        }
        if (taskId != null && taskId.isNotEmpty) {
          await Future<void>.delayed(const Duration(milliseconds: 1500));
          _dispatch(NotificationData.task(taskId: taskId, dueDate: due));
          return;
        }
      }

      // Local notifications cold start
      final details = await _localNotifications
          .getNotificationAppLaunchDetails();
      _logEvent(
        'coldstart.localInitial',
        data: {
          'didLaunchFromNotif': details?.didNotificationLaunchApp ?? false,
          'hasPayload': details?.notificationResponse?.payload != null,
        },
      );

      if ((details?.didNotificationLaunchApp ?? false) &&
          details!.notificationResponse?.payload != null) {
        final typed = NotificationData.fromPayloadJson(
          details.notificationResponse!.payload!,
        );
        if (typed != null) {
          await Future<void>.delayed(const Duration(milliseconds: 1500));
          _logEvent(
            'coldstart.localInitial.dispatch',
            data: typed.toPayloadMap(),
          );
          _dispatch(typed);
          return;
        }
      }

      _logEvent('coldstart.end', data: {'dispatched': false});
    } catch (e) {
      _logEvent(
        'coldstart.error',
        level: 'error',
        data: {'error': e.toString()},
      );
      if (kDebugMode) {
        print('Error checking initial notification details: $e');
      }
    }
  }
}
