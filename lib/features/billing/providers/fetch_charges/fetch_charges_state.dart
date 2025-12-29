import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'fetch_charges_state.freezed.dart';

@freezed
sealed class FetchChargesState with _$FetchChargesState {
  const factory FetchChargesState.initial() = InitialFetchChargesState;
  const factory FetchChargesState.loading() = LoadingFetchChargesState;
  const factory FetchChargesState.success({
    required List<ChargeModel> charges,
  }) = SuccessFetchChargesState;
  const factory FetchChargesState.error({required String message}) =
      ErrorFetchChargesState;
}

@freezed
sealed class CreateChargeState with _$CreateChargeState {
  const factory CreateChargeState.initial() = InitialCreateChargeState;
  const factory CreateChargeState.loading() = LoadingCreateChargeState;
  const factory CreateChargeState.success({
    required ChargeModel charge,
  }) = SuccessCreateChargeState;
  const factory CreateChargeState.error({required String message}) =
      ErrorCreateChargeState;
}
