import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'fetch_appointments_state.freezed.dart';

@freezed
sealed class FetchAppointmentsState with _$FetchAppointmentsState {
  const factory FetchAppointmentsState.initial() = InitialFetchAppointmentsState;
  const factory FetchAppointmentsState.loading() = LoadingFetchAppointmentsState;
  const factory FetchAppointmentsState.success({
    required List<VendorAppointment> appointments,
  }) = SuccessFetchAppointmentsState;
  const factory FetchAppointmentsState.error({required String message}) =
      ErrorFetchAppointmentsState;
}
