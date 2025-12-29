// ignore_for_file: public_member_api_docs

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

extension LocaleExtension on Locale {
  static String toLabel(Locale locale) {
    switch (locale.languageCode.toLowerCase()) {
      case 'en':
        return 'English';
      case 'english':
        return 'English';
      case 'da':
        return 'Danish';
      case 'danish':
        return 'Danish';
      case 'es':
        return 'Español';
      case 'spanish':
        return 'Español';
      default:
        throw ArgumentError('Invalid value for Locale: $locale');
    }
  }

  static Locale toLocale(BuildContext context, String languageCode) {
    // final supportedLocales = context.supportedLocales;
    switch (languageCode.toLowerCase()) {
      case 'en':
        return const Locale('en', '');
      case 'es':
        return const Locale('es', '');
      default:
        throw ArgumentError('Invalid value for LanguageCode: $languageCode');
    }
  }

  static AssetGenImage getIcon(Locale locale) {
    switch (locale.languageCode.toLowerCase()) {
      // case 'en':
      //   return Assets.icons.en;
      // case 'english':
      //   return Assets.icons.en;
      // case 'es':
      //   return Assets.icons.es;
      // case 'spanish':
      //   return Assets.icons.es;
      default:
        throw ArgumentError('Invalid value for Locale: $locale');
    }
  }
}
