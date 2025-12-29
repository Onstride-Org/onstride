/// Adds some useful methods to the Map class.
extension MapX<K, V> on Map<dynamic, dynamic> {
  /// Applies [transform] to all nested entries.
  void updateAllRecursively(V Function(dynamic, dynamic) transform) {
    for (final entry in entries) {
      final value = entry.value;
      if (value is Map<K, V>) {
        value.updateAllRecursively(transform);
      } else if (value is List<dynamic>) {
        for (final element in value) {
          if (element is Map<K, V>) {
            element.updateAllRecursively(transform);
          }
        }
      } else {
        update(entry.key, (value) => transform(entry.key, value));
      }
    }
  }
}
