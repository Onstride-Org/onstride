import 'package:barns_repository/barns_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:users_repository/users_repository.dart';

part 'fetch_all_owners_provider.freezed.dart';
part 'fetch_all_owners_provider.g.dart';
part 'fetch_all_owners_state.dart';

@Riverpod(keepAlive: true)
class FetchAllOwners extends _$FetchAllOwners {
  UsersRepository get _repository => ref.read(usersRepositoryProvider);
  BarnsRepository get _barnsRepository => ref.read(barnsRepositoryProvider);

  @override
  FetchAllOwnersState build() => const FetchAllOwnersState();

  Future<void> fetchAllOwners({bool reload = false}) async {
    state = state.copyWith(
      status: RequestStatus.loading,
      exception: null,
    );

    try {
      final owners = await _repository.fetchUsersByType(
        accountType: AccountType.owner,
      );

      owners.sort((a, b) {
        final nameA = a.name?.toLowerCase() ?? '';
        final nameB = b.name?.toLowerCase() ?? '';
        return nameA.compareTo(nameB);
      });

      final ownerBarns = <String, BarnModel>{};
      for (final owner in owners) {
        final barnId = owner.barnId;
        if (barnId != null) {
          try {
            final barn = await _barnsRepository.getBarnById(
              barnId: barnId,
            );
            if (barn != null) {
              ownerBarns[owner.id] = barn;
            }
          } on Exception catch (e) {
            if (kDebugMode) {
              print('Failed to fetch barn for owner ${owner.id}: $e');
            }
          }
        }
      }

      state = state.copyWith(
        status: RequestStatus.success,
        owners: owners,
        ownerBarns: ownerBarns,
      );
    } on DataProviderException catch (e) {
      state = state.copyWith(
        status: RequestStatus.error,
        exception: e,
      );
    } on Exception catch (e) {
      state = state.copyWith(
        status: RequestStatus.error,
        exception: UnknownDataProviderException(e.toString()),
      );
    }
  }
}
