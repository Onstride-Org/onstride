import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'splash_provider.freezed.dart';
part 'splash_provider.g.dart';
part 'splash_state.dart';

@riverpod
class Splash extends _$Splash {
  // Repository get _repository => ref.read();

  Future<void> callback() async {
    // state = const SplashState.loading();
    // final response = await _repository.callback();
    // switch (response) {
    //   case SuccessResult(:final data):
    //     state = SplashState.success(user: data);
    //   case ErrorResult(:final exception):
    //     state = SplashState.error(exception: exception);
    // }
  }

  @override
  SplashState build() => const SplashState.initial();
}
