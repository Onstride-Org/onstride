extension DoubleExt on double {
  String get formatWithDecimalsIfHas {
    if (this % 1 == 0) {
      return toInt().toString();
    } else {
      return toStringAsFixed(2);
    }
  }

  String get toPercent {
    return (this * 100).toStringAsFixed(2);
  }
}
