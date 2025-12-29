import 'package:freezed_annotation/freezed_annotation.dart';

part 'notification_preferences.freezed.dart';
part 'notification_preferences.g.dart';

/// User notification preferences for controlling what notifications they receive.
@freezed
sealed class NotificationPreferences with _$NotificationPreferences {
  const factory NotificationPreferences({
    /// Master toggle for all push notifications
    @Default(true) bool pushEnabled,

    /// Master toggle for all email notifications
    @Default(true) bool emailEnabled,

    /// Task-related notification settings
    @Default(TaskNotificationSettings()) TaskNotificationSettings tasks,

    /// Invoice-related notification settings
    @Default(InvoiceNotificationSettings()) InvoiceNotificationSettings invoices,

    /// Ride log notification settings
    @Default(RideLogNotificationSettings()) RideLogNotificationSettings rideLogs,

    /// General/system notification settings
    @Default(GeneralNotificationSettings()) GeneralNotificationSettings general,
  }) = _NotificationPreferences;

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) =>
      _$NotificationPreferencesFromJson(json);
}

/// Task-specific notification settings.
@freezed
sealed class TaskNotificationSettings with _$TaskNotificationSettings {
  const factory TaskNotificationSettings({
    /// Notify when a task is assigned to you
    @Default(true) bool onAssigned,

    /// Notify when a task is due soon (1 hour before)
    @Default(true) bool onDueSoon,

    /// Notify when a task you assigned is completed
    @Default(true) bool onCompleted,

    /// Notify when a task is overdue
    @Default(true) bool onOverdue,

    /// How many minutes before due to send reminder (default 60 = 1 hour)
    @Default(60) int reminderMinutesBefore,
  }) = _TaskNotificationSettings;

  factory TaskNotificationSettings.fromJson(Map<String, dynamic> json) =>
      _$TaskNotificationSettingsFromJson(json);
}

/// Invoice-specific notification settings.
@freezed
sealed class InvoiceNotificationSettings with _$InvoiceNotificationSettings {
  const factory InvoiceNotificationSettings({
    /// Notify when a new invoice is created for you
    @Default(true) bool onCreated,

    /// Notify when an invoice is due soon
    @Default(true) bool onDueSoon,

    /// Notify when an invoice is paid
    @Default(true) bool onPaid,

    /// Notify when an invoice is overdue
    @Default(true) bool onOverdue,

    /// How many days before due to send reminder
    @Default(3) int reminderDaysBefore,
  }) = _InvoiceNotificationSettings;

  factory InvoiceNotificationSettings.fromJson(Map<String, dynamic> json) =>
      _$InvoiceNotificationSettingsFromJson(json);
}

/// Ride log notification settings.
@freezed
sealed class RideLogNotificationSettings with _$RideLogNotificationSettings {
  const factory RideLogNotificationSettings({
    /// Notify when someone logs a ride on your horse (for boarders)
    @Default(true) bool onRideLogged,

    /// Notify for weekly ride summary
    @Default(false) bool weeklySummary,
  }) = _RideLogNotificationSettings;

  factory RideLogNotificationSettings.fromJson(Map<String, dynamic> json) =>
      _$RideLogNotificationSettingsFromJson(json);
}

/// General/system notification settings.
@freezed
sealed class GeneralNotificationSettings with _$GeneralNotificationSettings {
  const factory GeneralNotificationSettings({
    /// Notify about app updates and announcements
    @Default(true) bool appUpdates,

    /// Notify about new features
    @Default(true) bool newFeatures,

    /// Quiet hours start (24h format, e.g., 22 for 10PM)
    int? quietHoursStart,

    /// Quiet hours end (24h format, e.g., 7 for 7AM)
    int? quietHoursEnd,
  }) = _GeneralNotificationSettings;

  factory GeneralNotificationSettings.fromJson(Map<String, dynamic> json) =>
      _$GeneralNotificationSettingsFromJson(json);
}
