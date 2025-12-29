part of 'fetch_all_owners_provider.dart';

@freezed
sealed class FetchAllOwnersState with _$FetchAllOwnersState {
  const factory FetchAllOwnersState({
    @Default(RequestStatus.initial) RequestStatus status,
    @Default([]) List<GLUser> owners,
    @Default({}) Map<String, BarnModel> ownerBarns,
    DataProviderException? exception,
  }) = _FetchAllOwnersState;
}
