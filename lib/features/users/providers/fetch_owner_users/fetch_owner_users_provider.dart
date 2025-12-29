// fetch_owner_users_provider.dart
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:users_repository/users_repository.dart';

part 'fetch_owner_users_provider.freezed.dart';
part 'fetch_owner_users_provider.g.dart';
part 'fetch_owner_users_state.dart';

@Riverpod(keepAlive: true)
class FetchUsers extends _$FetchUsers {
  UsersRepository get _repository => ref.read(usersRepositoryProvider);

  @override
  FetchUsersState build() => const FetchUsersState();

  // ---------- Internal helpers ----------

  /// Returns the set of ids that are NOT present in state.mapUsers.
  Set<String> _missingIds(Iterable<String> ids) {
    final loaded = state.mapUsers;
    return ids.where((id) => !loaded.containsKey(id)).toSet();
  }

  /// Merge users into mapUsers (upsert semantics).
  Map<String, GLUser> _mergeIntoMap(Iterable<GLUser> incoming) {
    if (incoming.isEmpty) return state.mapUsers;
    final next = Map<String, GLUser>.of(state.mapUsers);
    for (final u in incoming) {
      next[u.id] = u;
    }
    return next;
  }

  /// Replace mapUsers completely.
  Map<String, GLUser> _replaceMap(Iterable<GLUser> incoming) {
    return {for (final u in incoming) u.id: u};
  }

  // ---------- Mutations for single user ----------

  void add(GLUser user) {
    state = state.copyWith(mapUsers: _mergeIntoMap([user]));
  }

  void updateUser(GLUser user) {
    state = state.copyWith(mapUsers: _mergeIntoMap([user]));
  }

  void remove(GLUser user) {
    final next = Map<String, GLUser>.of(state.mapUsers)..remove(user.id);
    state = state.copyWith(mapUsers: next);
  }

  // ---------- Load by explicit ids (skips already-loaded) ----------

  void loadByHorses(List<HorseModel> horses) {
    final ids = horses.map((e) => e.boarderId).whereType<String>().toList();
    loadByIds(ids);
  }

  Future<void> loadByIds(List<String> ids, {bool reload = false}) async {
    if (ids.isEmpty) return;
    final targetIds = reload ? ids.toSet() : _missingIds(ids);
    if (targetIds.isEmpty) return;
    state = state.copyWith(status: RequestStatus.loading, exception: null);
    try {
      final fetched = await _repository.fetchUsersByIds(targetIds.toList());
      state = state.copyWith(
        status: RequestStatus.success,
        mapUsers: reload ? _replaceMap(fetched) : _mergeIntoMap(fetched),
      );
    } on DataProviderException catch (e) {
      state = state.copyWith(status: RequestStatus.error, exception: e);
    } catch (e) {
      state = state.copyWith(
        status: RequestStatus.error,
        exception: UnknownDataProviderException(e.toString()),
      );
    }
  }

  // ---------- Owner/Barn-scoped fetch ----------
  Future<void> fetchUsers({bool reload = false}) async {
    state = state.copyWith(
      status: RequestStatus.loading,
      exception: null,
      hasMoreData: reload ? true : state.hasMoreData,
    );

    try {
      final user = ref.read(accountProvider).currentUser;

      final newUsers = await _repository.fetchBarnUsers(
        barnId: user.barnId ?? '',
        reload: reload,
      );

      final noMore = newUsers.isEmpty;

      state = state.copyWith(
        status: RequestStatus.success,
        mapUsers: reload ? _replaceMap(newUsers) : _mergeIntoMap(newUsers),
        hasMoreData: noMore ? false : true,
      );
    } on DataProviderException catch (e) {
      state = state.copyWith(status: RequestStatus.error, exception: e);
    } catch (e) {
      state = state.copyWith(
        status: RequestStatus.error,
        exception: UnknownDataProviderException(e.toString()),
      );
    }
  }

  Future<void> fetchAllUsers({bool reload = false}) async {
    if (reload) {
      await fetchUsers(reload: true);
    }
    if (!state.hasMoreData) return;

    var lastLen = state.mapUsers.length;
    while (state.hasMoreData) {
      await fetchUsers();
      final newLen = state.mapUsers.length;
      if (newLen <= lastLen) break;
      lastLen = newLen;
    }
  }

  // ---------- Optional convenience: fetchUsersByIds (alias) ----------

  Future<void> fetchUsersByIds(List<String> ids, {bool reload = false}) async {
    // kept for backward-compat; routes to loadByIds
    await loadByIds(ids, reload: reload);
  }

  void reset() => state = const FetchUsersState();
}
