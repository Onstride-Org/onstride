import 'package:freezed_annotation/freezed_annotation.dart';

class TimestampConverter implements JsonConverter<DateTime, Object?> {
  const TimestampConverter();

  @override
  DateTime fromJson(Object? json) {
    if (json == null) {
      return DateTime.now();
    }
    if (json is DateTime) return json;
    if (json is int) {
      return DateTime.fromMillisecondsSinceEpoch(json, isUtc: true).toLocal();
    }
    if (json is String) {
      return DateTime.parse(json);
    }

    try {
      final dt = (json as dynamic).toDate();
      if (dt is DateTime) return dt;
    } catch (_) {}
    try {
      final ms = (json as dynamic).millisecondsSinceEpoch as int;
      return DateTime.fromMillisecondsSinceEpoch(ms, isUtc: true).toLocal();
    } catch (_) {}

    if (json.toString().contains('FieldValue')) {
      return DateTime.now();
    }

    throw ArgumentError('Invalid timestamp value: $json');
  }

  @override
  Object toJson(DateTime value) {
    return value.toUtc().toIso8601String();
  }
}

/// Custom converter to handle Firestore/Firebase timestamps, integers,
/// ISO strings, or null values gracefully.
class NullableTimestampConverter implements JsonConverter<DateTime?, Object?> {
  const NullableTimestampConverter();

  @override
  DateTime? fromJson(Object? json) {
    if (json == null) {
      return null;
    }
    if (json is DateTime) return json;
    if (json is int) {
      return DateTime.fromMillisecondsSinceEpoch(json, isUtc: true).toLocal();
    }
    if (json is String) {
      return DateTime.tryParse(json);
    }

    try {
      final dt = (json as dynamic).toDate();
      if (dt is DateTime) return dt;
    } catch (_) {}

    try {
      final ms = (json as dynamic).millisecondsSinceEpoch as int;
      return DateTime.fromMillisecondsSinceEpoch(ms, isUtc: true).toLocal();
    } catch (_) {}

    if (json.toString().contains('FieldValue')) {
      return null;
    }

    throw ArgumentError('Invalid timestamp value: $json');
  }

  @override
  Object? toJson(DateTime? value) {
    if (value == null) return null;
    return value.toUtc().toIso8601String();
  }
}
