import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

final AutoDisposeChangeNotifierProvider<PrefsState> prefsProvider =
    ChangeNotifierProvider.autoDispose(
        (AutoDisposeChangeNotifierProviderRef<PrefsState> ref) {
  return PrefsState();
});

class PrefsState extends ChangeNotifier {
  PrefsState() {
    getCurrentLocale();
    getCurrentThemeMode();
  }

  Locale? locale;
  ThemeMode? themeMode;

  void getCurrentLocale() {
    final String languageCode = Hive.box('prefs').get('languageCode',
        defaultValue: ThemeMode.system.toString()) as String;
    switch (languageCode) {
      case 'en':
        locale = const Locale('en', '');
        break;
      case 'es':
        locale = const Locale('es', '');
        break;
      default:
        locale = const Locale('en', '');
        break;
    }
  }

  void getCurrentThemeMode() {
    final String mode = Hive.box('prefs')
        .get('themeMode', defaultValue: ThemeMode.system.toString()) as String;
    switch (mode) {
      case 'ThemeMode.dark':
        themeMode = ThemeMode.dark;
        break;
      case 'ThemeMode.light':
        themeMode = ThemeMode.light;
        break;
      case 'ThemeMode.system':
        themeMode = ThemeMode.system;
        break;
    }
  }

  void setLocale(Locale newLocale) {
    locale = newLocale;
    Hive.box('prefs').put('languageCode', newLocale.languageCode);
    notifyListeners();
  }

  void setThemeMode(ThemeMode mode) {
    themeMode = mode;
    Hive.box('prefs').put('themeMode', themeMode.toString());
    notifyListeners();
  }
}
