import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'create_ride_log_state.freezed.dart';

@freezed
sealed class CreateRideLogState with _$CreateRideLogState {
  const factory CreateRideLogState.initial() = InitialCreateRideLogState;
  const factory CreateRideLogState.loading() = LoadingCreateRideLogState;
  const factory CreateRideLogState.success({required RideLogModel rideLog}) =
      SuccessCreateRideLogState;
  const factory CreateRideLogState.error({required String message}) =
      ErrorCreateRideLogState;
}
