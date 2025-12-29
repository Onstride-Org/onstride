import 'package:duration/duration.dart';
import 'package:duration/locale.dart';
import 'package:flutter/widgets.dart';

/// Extension to make displaying [Duration] objects simpler.
extension DurationEx on Duration {
  /// Converts [Duration] into a formatted [String].
  String formatted([Locale? locale]) {
    final durationLocale =
        DurationLocale.fromLanguageCode(locale?.languageCode ?? '') ??
            const EnglishDurationLocale();
    return prettyDuration(this, locale: durationLocale);
  }
}
