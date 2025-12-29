// uint8list_converter.dart
import 'dart:convert';
import 'dart:typed_data';

import 'package:json_annotation/json_annotation.dart';

class Uint8ListBase64Converter implements JsonConverter<Uint8List, String> {
  const Uint8ListBase64Converter();

  @override
  Uint8List fromJson(String json) => base64Decode(json);

  @override
  String toJson(Uint8List object) => base64Encode(object);
}
