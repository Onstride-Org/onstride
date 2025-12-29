import 'package:intl/intl.dart';

/// Extension to make displaying [DateTime] objects simpler.
extension DateTimeEx on DateTime {
  /// Converts [DateTime] into MM/dd/yyyy [String].
  String get mmDdYy {
    final formatter = DateFormat('MM/dd/yyyy');
    return formatter.format(this);
  }

  /// Converts [DateTime] into MMM dd, yyyy - h:mm a [String].
  ///
  /// Example: Sep 18, 2025 - 2:30 PM
  String mmmDdYyyyTime(String locale) {
    final formatter = DateFormat('MMM dd, yyyy - h:mm a', locale);
    return formatter.format(this);
  }

  /// Converts [DateTime] into MM/dd/yyyy - h:mm a [String].
  ///
  /// Example: 09/18/2025 - 2:30 PM
  String get mmDdYyTime {
    final formatter = DateFormat('MM/dd/yyyy - h:mm a');
    return formatter.format(this);
  }
}
