import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'fetch_branding_state.freezed.dart';

@freezed
sealed class FetchBrandingState with _$FetchBrandingState {
  const factory FetchBrandingState.initial() = InitialFetchBrandingState;
  const factory FetchBrandingState.loading() = LoadingFetchBrandingState;
  const factory FetchBrandingState.success({
    BarnBranding? branding,
  }) = SuccessFetchBrandingState;
  const factory FetchBrandingState.error({required String message}) =
      ErrorFetchBrandingState;
}
