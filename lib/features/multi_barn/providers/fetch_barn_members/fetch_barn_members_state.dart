import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'fetch_barn_members_state.freezed.dart';

@freezed
sealed class FetchBarnMembersState with _$FetchBarnMembersState {
  const factory FetchBarnMembersState.initial() = InitialFetchBarnMembersState;
  const factory FetchBarnMembersState.loading() = LoadingFetchBarnMembersState;
  const factory FetchBarnMembersState.success({
    required List<UserBarnRole> members,
  }) = SuccessFetchBarnMembersState;
  const factory FetchBarnMembersState.error({required String message}) =
      ErrorFetchBarnMembersState;
}
