extension IterableX<T> on Iterable<T> {
  /// Returns the first element that satisfies [test], or null if none match.
  T? firstWhereOrNull(bool Function(T element) test) {
    for (final element in this) {
      if (test(element)) return element;
    }
    return null;
  }
}
