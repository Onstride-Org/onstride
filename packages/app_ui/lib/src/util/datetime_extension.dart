import 'package:intl/intl.dart';

///
extension DateTimeExtensions on DateTime {
  /// Returns true if one date is on the same day as another.
  bool isSameDayAs(DateTime other) {
    return year == other.year && month == other.month && day == other.day;
  }

  /// Returns true if one date is in the past relative to another..
  bool isYesterdayOrEarlierThan(DateTime other) {
    final date = DateTime(year, month, day);
    final otherDate = DateTime(other.year, other.month, other.day);
    return date.isBefore(otherDate);
  }

  /// Returns the date “month + day” according to the locale.
  /// - en*: “June 5th”
  /// - others: “5 June” (or natural language format)
  String monthDayForLocale(String locale) {
    final raw = locale;
    final lang = raw.trim().isEmpty ? 'en' : raw.trim().toLowerCase();

    // English with suffix
    if (lang.startsWith('en')) {
      try {
        final base = DateFormat('MMMM d', lang).format(this); // "June 5"
        return '$base${_englishDaySuffix(day)}'; // "June 5th"
      } catch (_) {
        final base = DateFormat('MMMM d', 'en').format(this);
        return '$base${_englishDaySuffix(day)}';
      }
    }

    // Patterns by language family
    final pattern = _patternFor(lang);
    try {
      return DateFormat(pattern, lang).format(this);
    } catch (_) {
      // Fallback to English if locale is not supported by the device/Intl data
      final base = DateFormat('MMMM d', 'en').format(this);
      return '$base${_englishDaySuffix(day)}';
    }
  }

  static String _patternFor(String lang) {
    // Add language-specific patterns.
    return 'MMMM d'; // default fallback: "June 5"
  }

  /// Returns the date formatted as "MonthName DayWithSuffix", e.g., "June 5th".
  static String _englishDaySuffix(int day) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }
}
