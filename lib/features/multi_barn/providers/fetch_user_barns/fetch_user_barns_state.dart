import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'fetch_user_barns_state.freezed.dart';

@freezed
sealed class FetchUserBarnsState with _$FetchUserBarnsState {
  const factory FetchUserBarnsState.initial() = InitialFetchUserBarnsState;
  const factory FetchUserBarnsState.loading() = LoadingFetchUserBarnsState;
  const factory FetchUserBarnsState.success({
    required List<BarnSummary> barns,
    BarnSummary? currentBarn,
  }) = SuccessFetchUserBarnsState;
  const factory FetchUserBarnsState.error({required String message}) =
      ErrorFetchUserBarnsState;
}
