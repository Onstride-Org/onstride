import 'package:json_annotation/json_annotation.dart';

/// A JsonConverter that handles DateTime conversion between UTC and Local time.
///
/// When serializing to JSON: converts DateTime to UTC ISO8601 string
/// When deserializing from JSON: converts ISO8601 string to local DateTime
class DateTimeConverter implements JsonConverter<DateTime, String> {
  const DateTimeConverter();

  @override
  DateTime fromJson(String json) {
    return DateTime.parse(json).toLocal();
  }

  @override
  String toJson(DateTime object) {
    return object.toUtc().toIso8601String();
  }
}
