import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'notification_preferences_provider.g.dart';
part 'notification_preferences_state.dart';

@riverpod
class NotificationPreferencesNotifier extends _$NotificationPreferencesNotifier {
  FirebaseFirestore get _firestore => FirebaseFirestore.instance;
  FirebaseAuth get _auth => FirebaseAuth.instance;

  @override
  NotificationPreferencesState build() {
    return const NotificationPreferencesState.initial();
  }

  /// Load notification preferences for the current user.
  Future<void> loadPreferences() async {
    state = const NotificationPreferencesState.loading();

    try {
      final user = _auth.currentUser;
      if (user == null) {
        state = const NotificationPreferencesState.error(
          'User not authenticated',
        );
        return;
      }

      final doc =
          await _firestore.collection('users').doc(user.uid).get();

      if (!doc.exists) {
        // Return default preferences if user doc doesn't exist
        state = const NotificationPreferencesState.loaded(
          NotificationPreferences(),
        );
        return;
      }

      final data = doc.data();
      final prefsData = data?['notification_preferences'] as Map<String, dynamic>?;

      if (prefsData == null) {
        // Return default preferences if not set
        state = const NotificationPreferencesState.loaded(
          NotificationPreferences(),
        );
        return;
      }

      final preferences = NotificationPreferences.fromJson(prefsData);
      state = NotificationPreferencesState.loaded(preferences);
    } catch (e) {
      state = NotificationPreferencesState.error(e.toString());
    }
  }

  /// Save notification preferences for the current user.
  Future<void> savePreferences(NotificationPreferences preferences) async {
    final previousState = state;
    state = const NotificationPreferencesState.saving();

    try {
      final user = _auth.currentUser;
      if (user == null) {
        state = const NotificationPreferencesState.error(
          'User not authenticated',
        );
        return;
      }

      await _firestore.collection('users').doc(user.uid).update({
        'notification_preferences': preferences.toJson(),
        'notification_preferences_updated_at': FieldValue.serverTimestamp(),
      });

      state = NotificationPreferencesState.loaded(preferences);
    } catch (e) {
      // Restore previous state on error
      state = previousState is LoadedNotificationPreferencesState
          ? previousState
          : NotificationPreferencesState.error(e.toString());
    }
  }

  /// Update a specific preference setting.
  Future<void> updatePreference({
    bool? pushEnabled,
    bool? emailEnabled,
    TaskNotificationSettings? tasks,
    InvoiceNotificationSettings? invoices,
    RideLogNotificationSettings? rideLogs,
    GeneralNotificationSettings? general,
  }) async {
    if (state is! LoadedNotificationPreferencesState) {
      return;
    }

    final current = (state as LoadedNotificationPreferencesState).preferences;
    final updated = current.copyWith(
      pushEnabled: pushEnabled ?? current.pushEnabled,
      emailEnabled: emailEnabled ?? current.emailEnabled,
      tasks: tasks ?? current.tasks,
      invoices: invoices ?? current.invoices,
      rideLogs: rideLogs ?? current.rideLogs,
      general: general ?? current.general,
    );

    await savePreferences(updated);
  }

  /// Toggle master push notification setting.
  Future<void> togglePushNotifications(bool enabled) async {
    await updatePreference(pushEnabled: enabled);
  }

  /// Toggle master email notification setting.
  Future<void> toggleEmailNotifications(bool enabled) async {
    await updatePreference(emailEnabled: enabled);
  }

  /// Update task notification settings.
  Future<void> updateTaskSettings({
    bool? onAssigned,
    bool? onDueSoon,
    bool? onCompleted,
    bool? onOverdue,
    int? reminderMinutesBefore,
  }) async {
    if (state is! LoadedNotificationPreferencesState) return;

    final current = (state as LoadedNotificationPreferencesState).preferences;
    final updated = current.tasks.copyWith(
      onAssigned: onAssigned ?? current.tasks.onAssigned,
      onDueSoon: onDueSoon ?? current.tasks.onDueSoon,
      onCompleted: onCompleted ?? current.tasks.onCompleted,
      onOverdue: onOverdue ?? current.tasks.onOverdue,
      reminderMinutesBefore:
          reminderMinutesBefore ?? current.tasks.reminderMinutesBefore,
    );

    await updatePreference(tasks: updated);
  }

  /// Update invoice notification settings.
  Future<void> updateInvoiceSettings({
    bool? onCreated,
    bool? onDueSoon,
    bool? onPaid,
    bool? onOverdue,
    int? reminderDaysBefore,
  }) async {
    if (state is! LoadedNotificationPreferencesState) return;

    final current = (state as LoadedNotificationPreferencesState).preferences;
    final updated = current.invoices.copyWith(
      onCreated: onCreated ?? current.invoices.onCreated,
      onDueSoon: onDueSoon ?? current.invoices.onDueSoon,
      onPaid: onPaid ?? current.invoices.onPaid,
      onOverdue: onOverdue ?? current.invoices.onOverdue,
      reminderDaysBefore:
          reminderDaysBefore ?? current.invoices.reminderDaysBefore,
    );

    await updatePreference(invoices: updated);
  }

  /// Update ride log notification settings.
  Future<void> updateRideLogSettings({
    bool? onRideLogged,
    bool? weeklySummary,
  }) async {
    if (state is! LoadedNotificationPreferencesState) return;

    final current = (state as LoadedNotificationPreferencesState).preferences;
    final updated = current.rideLogs.copyWith(
      onRideLogged: onRideLogged ?? current.rideLogs.onRideLogged,
      weeklySummary: weeklySummary ?? current.rideLogs.weeklySummary,
    );

    await updatePreference(rideLogs: updated);
  }

  /// Update general notification settings.
  Future<void> updateGeneralSettings({
    bool? appUpdates,
    bool? newFeatures,
    int? quietHoursStart,
    int? quietHoursEnd,
  }) async {
    if (state is! LoadedNotificationPreferencesState) return;

    final current = (state as LoadedNotificationPreferencesState).preferences;
    final updated = current.general.copyWith(
      appUpdates: appUpdates ?? current.general.appUpdates,
      newFeatures: newFeatures ?? current.general.newFeatures,
      quietHoursStart: quietHoursStart ?? current.general.quietHoursStart,
      quietHoursEnd: quietHoursEnd ?? current.general.quietHoursEnd,
    );

    await updatePreference(general: updated);
  }
}
