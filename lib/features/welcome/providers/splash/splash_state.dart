part of 'splash_provider.dart';

@freezed
sealed class SplashState with _$SplashState {
  const factory SplashState.initial() = InitialSplashState;

  const factory SplashState.loading() = LoadingSplashState;

  const factory SplashState.success() = SuccessSplashState;

  const factory SplashState.error({required Exception exception}) =
      ErrorSplashState;
}
