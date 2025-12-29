import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'fetch_vendors_state.freezed.dart';

@freezed
sealed class FetchVendorsState with _$FetchVendorsState {
  const factory FetchVendorsState.initial() = InitialFetchVendorsState;
  const factory FetchVendorsState.loading() = LoadingFetchVendorsState;
  const factory FetchVendorsState.success({
    required List<BarnVendor> vendors,
  }) = SuccessFetchVendorsState;
  const factory FetchVendorsState.error({required String message}) =
      ErrorFetchVendorsState;
}
