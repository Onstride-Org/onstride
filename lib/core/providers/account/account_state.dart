part of 'account_provider.dart';

@freezed
sealed class AccountState with _$AccountState {
  const factory AccountState.initial() = InitialAccountState;

  const factory AccountState.loading() = LoadingAccountState;

  const factory AccountState.success({
    required GLUser user,
    BarnModel? userBarn,
  }) = SuccessAccountState;

  const factory AccountState.updating({required GLUser user}) =
      UpdatingAccountState;

  const factory AccountState.error({
    required DataProviderException exception,
  }) = ErrorAccountState;
}

extension AccountExt on AccountState {
  GLUser get currentUser {
    if (this is SuccessAccountState) {
      return (this as SuccessAccountState).user;
    }
    return GLUser.anonymous;
  }

  BarnModel? get currentBarn {
    if (this is SuccessAccountState) {
      return (this as SuccessAccountState).userBarn;
    }
    return null;
  }
}
