import 'package:barns_repository/barns_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/config/config.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'set_barn_name_provider.freezed.dart';
part 'set_barn_name_provider.g.dart';
part 'set_barn_name_state.dart';

@riverpod
class SetBarnName extends _$SetBarnName {
  BarnsRepository get _repository => ref.read(barnsRepositoryProvider);

  Future<void> setBarnName({
    required String ownerId,
    required String name,
  }) async {
    try {
      state = const SetBarnNameState.loading();
      final connectedAccountId = ref
          .read(remoteConfigClientProvider)
          .getString('default_connected_account_id');
      final barn = await _repository.createBarn(
        ownerId: ownerId,
        name: name,
        connectedAccountId: connectedAccountId,
      );
      state = SetBarnNameState.success(barn: barn);
    } on DataProviderException catch (e) {
      state = SetBarnNameState.error(exception: e);
    }
  }

  @override
  SetBarnNameState build() => const SetBarnNameState.initial();
}
