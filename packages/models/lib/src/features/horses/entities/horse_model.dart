import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'horse_model.freezed.dart';
part 'horse_model.g.dart';

enum HorseStatus { active, inactive }

typedef HorseBreed = LangValue;
typedef HorseSexStatus = LangValue;

@freezed
sealed class HorseModel with _$HorseModel {
  const factory HorseModel({
    required String id,
    required String barnId,
    required String name,
    required HorseSexStatus sexStatus,
    required HorseBreed breed,
    required int age,
    required DateTime birthday,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime updatedAt,
    @Default('') String createdById,
    String? color,
    String? boarderId,
    HorseStatus? status,
    @JsonKey(fromJson: fromStringOrNullableInt) int? stallId,
    @Default(<GLHorsesDocument>[]) List<GLHorsesDocument> documents,
    String? deletedBy,
    String? deletionReason,
    @NullableTimestampConverter() DateTime? deletedAt,
  }) = _HorseModel;

  factory HorseModel.fromJson(Map<String, dynamic> json) =>
      _$HorseModelFromJson(json);
}

@freezed
sealed class HorseSummary with _$HorseSummary {
  const factory HorseSummary({
    required String id,
    required String name,
    String? boarderId,
  }) = _HorseSummary;

  factory HorseSummary.fromJson(Map<String, dynamic> json) =>
      _$HorseSummaryFromJson(json);
}

extension HorseModelX on HorseModel {
  HorseSummary toSummary() {
    return HorseSummary(
      id: id,
      name: name,
      boarderId: boarderId,
    );
  }
}
