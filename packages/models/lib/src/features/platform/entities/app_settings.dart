import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'app_settings.freezed.dart';
part 'app_settings.g.dart';

/// Supported app languages
enum AppLanguage {
  en, // English
  es, // Spanish
  fr, // French
  de, // German
  pt, // Portuguese
  it, // Italian
  nl, // Dutch
}

/// Date format preferences
enum DateFormatPreference {
  mdy, // MM/DD/YYYY (US)
  dmy, // DD/MM/YYYY (Europe)
  ymd, // YYYY-MM-DD (ISO)
}

/// Time format preferences
enum TimeFormatPreference {
  h12, // 12-hour with AM/PM
  h24, // 24-hour
}

/// Measurement unit preferences
enum MeasurementUnit {
  imperial, // hands, pounds, miles
  metric, // centimeters, kilograms, kilometers
}

/// Currency preferences
enum CurrencyPreference {
  usd,
  eur,
  gbp,
  cad,
  aud,
  mxn,
}

/// User's app settings and preferences
@freezed
sealed class UserAppSettings with _$UserAppSettings {
  const factory UserAppSettings({
    required String userId,

    /// Language & Locale
    @Default(AppLanguage.en) AppLanguage language,
    @Default(DateFormatPreference.mdy) DateFormatPreference dateFormat,
    @Default(TimeFormatPreference.h12) TimeFormatPreference timeFormat,
    @Default(MeasurementUnit.imperial) MeasurementUnit measurementUnit,
    @Default(CurrencyPreference.usd) CurrencyPreference currency,
    String? timezone,

    /// Display preferences
    @Default(ThemeMode.system) ThemeMode themeMode,
    @Default(false) bool highContrastMode,
    @Default(1.0) double textScaleFactor,
    @Default(true) bool showAnimations,

    /// Default views
    @Default('dashboard') String defaultHomeScreen,
    @Default('list') String defaultHorseView, // 'list', 'grid', 'calendar'
    @Default('week') String defaultCalendarView, // 'day', 'week', 'month'

    /// Data preferences
    @Default(true) bool enableOfflineMode,
    @Default(true) bool autoSyncWhenOnline,
    @Default(true) bool syncOverCellular,

    /// Privacy
    @Default(true) bool shareAnalytics,
    @Default(true) bool crashReporting,

    @TimestampConverter() required DateTime updatedAt,
  }) = _UserAppSettings;

  factory UserAppSettings.fromJson(Map<String, dynamic> json) =>
      _$UserAppSettingsFromJson(json);
}

enum ThemeMode {
  light,
  dark,
  system,
}

/// Platform-specific settings
@freezed
sealed class PlatformSettings with _$PlatformSettings {
  const factory PlatformSettings({
    /// Web-specific
    @Default(false) bool enablePwa,
    @Default(true) bool showInstallPrompt,

    /// Mobile-specific
    @Default(true) bool enableBiometricAuth,
    @Default(true) bool enableFaceId,
    @Default(true) bool enableTouchId,
    @Default(true) bool keepScreenOn,

    /// Tablet-specific
    @Default(true) bool useSplitView,
    @Default(300) int sidebarWidth,

    /// Sync settings
    @Default(15) int syncIntervalMinutes,
    @Default(100) int maxCachedItems,
    @Default(50) int offlineStorageLimitMb,
  }) = _PlatformSettings;

  factory PlatformSettings.fromJson(Map<String, dynamic> json) =>
      _$PlatformSettingsFromJson(json);
}

/// App version and update info
@freezed
sealed class AppVersionInfo with _$AppVersionInfo {
  const factory AppVersionInfo({
    required String currentVersion,
    required String minimumRequiredVersion,
    String? latestVersion,
    String? releaseNotes,
    String? updateUrl,
    @Default(false) bool forceUpdate,
    @Default(false) bool recommendUpdate,
    @NullableTimestampConverter() DateTime? checkedAt,
  }) = _AppVersionInfo;

  factory AppVersionInfo.fromJson(Map<String, dynamic> json) =>
      _$AppVersionInfoFromJson(json);
}

/// Deep link configuration
@freezed
sealed class DeepLinkConfig with _$DeepLinkConfig {
  const factory DeepLinkConfig({
    required String scheme, // 'onstride'
    required String webDomain, // 'app.onstride.com'
    @Default(<String, String>{}) Map<String, String> pathPatterns,
  }) = _DeepLinkConfig;

  factory DeepLinkConfig.fromJson(Map<String, dynamic> json) =>
      _$DeepLinkConfigFromJson(json);
}
