int fromStringOrInt(dynamic e) {
  if (e is num) {
    return e.toInt();
  }
  return int.tryParse(e.toString()) ?? -1;
}

int? fromStringOrNullableInt(dynamic e) {
  if (e is num) {
    return e.toInt();
  }
  return int.tryParse(e.toString());
}
