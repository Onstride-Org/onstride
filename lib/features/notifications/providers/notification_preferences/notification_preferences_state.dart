part of 'notification_preferences_provider.dart';

/// State for notification preferences.
sealed class NotificationPreferencesState {
  const NotificationPreferencesState();

  const factory NotificationPreferencesState.initial() =
      InitialNotificationPreferencesState;
  const factory NotificationPreferencesState.loading() =
      LoadingNotificationPreferencesState;
  const factory NotificationPreferencesState.loaded(
    NotificationPreferences preferences,
  ) = LoadedNotificationPreferencesState;
  const factory NotificationPreferencesState.saving() =
      SavingNotificationPreferencesState;
  const factory NotificationPreferencesState.error(String message) =
      ErrorNotificationPreferencesState;
}

class InitialNotificationPreferencesState extends NotificationPreferencesState {
  const InitialNotificationPreferencesState();
}

class LoadingNotificationPreferencesState extends NotificationPreferencesState {
  const LoadingNotificationPreferencesState();
}

class LoadedNotificationPreferencesState extends NotificationPreferencesState {
  const LoadedNotificationPreferencesState(this.preferences);

  final NotificationPreferences preferences;
}

class SavingNotificationPreferencesState extends NotificationPreferencesState {
  const SavingNotificationPreferencesState();
}

class ErrorNotificationPreferencesState extends NotificationPreferencesState {
  const ErrorNotificationPreferencesState(this.message);

  final String message;
}
