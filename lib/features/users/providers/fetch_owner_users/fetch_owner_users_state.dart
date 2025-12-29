// fetch_owner_users_state.dart
part of 'fetch_owner_users_provider.dart';

@freezed
sealed class FetchUsersState with _$FetchUsersState {
  const factory FetchUsersState({
    @Default(RequestStatus.initial) RequestStatus status,
    @Default(<String, GLUser>{}) Map<String, GLUser> mapUsers,
    DataProviderException? exception,
    @Default(true) bool hasMoreData,
  }) = _FetchUsersState;
}

extension FetchUsersStateExt on FetchUsersState {
  List<GLUser> get allUsers => mapUsers.values.toList(growable: false);

  List<GLUser> get boarders => mapUsers.values
      .where(
        (u) => u.isBoarder == true && u.name != null && u.name!.isNotEmpty,
      )
      .toList(growable: false);

  List<GLUser> get groomers => mapUsers.values
      .where((u) => u.isGroomer == true && u.name != null && u.name!.isNotEmpty)
      .toList(growable: false);

  GLUser? getUserById(String? id) => id == null ? null : mapUsers[id];
}
