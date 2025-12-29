import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'invoice_request.freezed.dart';
part 'invoice_request.g.dart';

@freezed
sealed class InvoiceRequest with _$InvoiceRequest {
  const factory InvoiceRequest({
    required String barnId,
    required String boarderId,
    required String horseId,
    required String horseName,
    required String boarderName,
    // required double feePercent,
    required DateTime dueDate,
    required String createdById,
    required StripeFees allFees,
    @JsonKey(toJson: _customToJson) required List<String> searchTerms,
    @Default(<InvoiceCharge>[]) List<InvoiceCharge> charges,
    @Default(InvoiceStatus.pending) InvoiceStatus status,
  }) = _InvoiceRequest;

  factory InvoiceRequest.fromJson(Map<String, dynamic> json) =>
      _$InvoiceRequestFromJson(json);
}

List<String> _customToJson(List<String> terms) {
  final results = <String>[];

  for (final term in terms) {
    final token = term.trim().toLowerCase();
    if (token.isEmpty) continue;

    for (var i = 1; i <= token.length; i++) {
      results.add(token.substring(0, i));
    }
  }

  return results.toSet().toList();
}
