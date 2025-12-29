///
extension DoubleExtension on double {
  /// Omit the decimal place value when it is zero.
  String withoutTrailingZero() {
    if (this % 1 == 0) {
      return toInt().toString();
    }
    return toString();
  }
}
