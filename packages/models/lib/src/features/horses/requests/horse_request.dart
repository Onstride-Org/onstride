import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'horse_request.freezed.dart';
part 'horse_request.g.dart';

@freezed
sealed class HorseRequest with _$HorseRequest {
  const factory HorseRequest({
    required String name,
    required String barnId,
    required String createdById,
    required HorseSexStatus sexStatus,
    required HorseBreed breed,
    required int age,
    required DateTime birthday,
    String? color,
    String? boarderId,
    HorseStatus? status,
    @JsonKey(fromJson: fromStringOrNullableInt) int? stallId,
    @JsonKey(includeToJson: false)
    @Default([])
    List<GLHorsesDocument> documentsToDelete,
  }) = _HorseRequest;

  factory HorseRequest.fromJson(Map<String, dynamic> json) =>
      _$HorseRequestFromJson(json);
}
