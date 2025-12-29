import 'package:freezed_annotation/freezed_annotation.dart';

part 'payment_intent_response.freezed.dart';
part 'payment_intent_response.g.dart';

@freezed
sealed class PaymentIntentResponse with _$PaymentIntentResponse {
  @JsonSerializable(fieldRename: FieldRename.none)
  const factory PaymentIntentResponse({
    required String paymentIntentClientSecret,
    required String customerId,
    required String ephemeralKeySecret,
  }) = _PaymentIntentResponse;

  factory PaymentIntentResponse.fromJson(Map<String, dynamic> json) =>
      _$PaymentIntentResponseFromJson(json);
}
