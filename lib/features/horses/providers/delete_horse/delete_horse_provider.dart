import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/common/common.dart';
import 'package:gl_horses/core/config/config.dart';
import 'package:horse_repository/horse_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'delete_horse_provider.freezed.dart';
part 'delete_horse_provider.g.dart';
part 'delete_horse_state.dart';

@riverpod
class DeleteHorse extends _$DeleteHorse with ProviderGuardMixin {
  @override
  DeleteHorseState build() => const DeleteHorseState.initial();

  HorseRepository get _repository => ref.read(horseRepositoryProvider);

  Future<void> deleteHorse({
    required HorseModel horse,
    required String deletedBy,
  }) async {
    await guard<void>(
      onStart: () => state = const DeleteHorseState.loading(),
      action: () => _repository.deleteHorse(horse: horse, deletedBy: deletedBy),
      onSuccess: (_) => state = DeleteHorseState.success(horse),
      onException: (e) => state = DeleteHorseState.error(e),
    );
  }
}
