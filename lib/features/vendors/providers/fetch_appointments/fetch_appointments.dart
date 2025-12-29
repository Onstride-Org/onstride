import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/vendors/providers/fetch_appointments/fetch_appointments_state.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:vendors_repository/vendors_repository.dart';

part 'fetch_appointments.g.dart';

@riverpod
class FetchAppointments extends _$FetchAppointments {
  VendorsRepository get _repo => ref.read(vendorsRepositoryProvider);

  @override
  FetchAppointmentsState build() => const FetchAppointmentsState.initial();

  Future<void> fetchForBarn({
    required String barnId,
    DateTime? startDate,
    DateTime? endDate,
    AppointmentStatus? statusFilter,
  }) async {
    try {
      state = const FetchAppointmentsState.loading();
      final appointments = await _repo.getBarnAppointments(
        barnId: barnId,
        startDate: startDate,
        endDate: endDate,
        statusFilter: statusFilter,
      );
      state = FetchAppointmentsState.success(appointments: appointments);
    } catch (e) {
      state = FetchAppointmentsState.error(message: e.toString());
    }
  }

  Future<void> createAppointment(CreateAppointmentPayload payload) async {
    try {
      final appointment = await _repo.createAppointment(payload);
      if (state is SuccessFetchAppointmentsState) {
        final currentState = state as SuccessFetchAppointmentsState;
        state = FetchAppointmentsState.success(
          appointments: [appointment, ...currentState.appointments],
        );
      }
    } catch (e) {
      state = FetchAppointmentsState.error(message: e.toString());
    }
  }

  Future<void> updateAppointment(UpdateAppointmentPayload payload) async {
    try {
      final updated = await _repo.updateAppointment(payload);
      if (state is SuccessFetchAppointmentsState) {
        final currentState = state as SuccessFetchAppointmentsState;
        state = FetchAppointmentsState.success(
          appointments: currentState.appointments
              .map((a) => a.id == updated.id ? updated : a)
              .toList(),
        );
      }
    } catch (e) {
      state = FetchAppointmentsState.error(message: e.toString());
    }
  }

  Future<void> cancelAppointment({
    required String appointmentId,
    required String barnId,
    required String cancelledBy,
    String? reason,
  }) async {
    try {
      await _repo.cancelAppointment(
        appointmentId: appointmentId,
        barnId: barnId,
        cancelledBy: cancelledBy,
        reason: reason,
      );
      if (state is SuccessFetchAppointmentsState) {
        final currentState = state as SuccessFetchAppointmentsState;
        state = FetchAppointmentsState.success(
          appointments: currentState.appointments
              .map((a) => a.id == appointmentId
                  ? a.copyWith(status: AppointmentStatus.cancelled)
                  : a)
              .toList(),
        );
      }
    } catch (e) {
      state = FetchAppointmentsState.error(message: e.toString());
    }
  }
}
