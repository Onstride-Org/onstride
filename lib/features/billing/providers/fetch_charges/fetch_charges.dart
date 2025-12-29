import 'package:billing_repository/billing_repository.dart';
import 'package:gl_horses/core/config/dependency_injection/repository/repository_providers.dart';
import 'package:gl_horses/features/billing/providers/fetch_charges/fetch_charges_state.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fetch_charges.g.dart';

@riverpod
class FetchCharges extends _$FetchCharges {
  BillingRepository get _repo => ref.read(billingRepositoryProvider);

  @override
  FetchChargesState build() => const FetchChargesState.initial();

  Future<void> fetchForClient({
    required String clientId,
    required String barnId,
    ChargeStatus? statusFilter,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      state = const FetchChargesState.loading();
      final charges = await _repo.getClientCharges(
        clientId: clientId,
        barnId: barnId,
        statusFilter: statusFilter,
        startDate: startDate,
        endDate: endDate,
      );
      state = FetchChargesState.success(charges: charges);
    } catch (e) {
      state = FetchChargesState.error(message: e.toString());
    }
  }

  Future<void> fetchForPeriod({
    required String billingPeriodId,
    required String barnId,
  }) async {
    try {
      state = const FetchChargesState.loading();
      final charges = await _repo.getPeriodCharges(
        billingPeriodId: billingPeriodId,
        barnId: barnId,
      );
      state = FetchChargesState.success(charges: charges);
    } catch (e) {
      state = FetchChargesState.error(message: e.toString());
    }
  }

  void addCharge(ChargeModel charge) {
    if (state is SuccessFetchChargesState) {
      final currentState = state as SuccessFetchChargesState;
      final updated = [charge, ...currentState.charges];
      state = FetchChargesState.success(charges: updated);
    }
  }

  void updateCharge(ChargeModel charge) {
    if (state is SuccessFetchChargesState) {
      final currentState = state as SuccessFetchChargesState;
      final updated = currentState.charges
          .map((c) => c.id == charge.id ? charge : c)
          .toList();
      state = FetchChargesState.success(charges: updated);
    }
  }

  void removeCharge(String chargeId) {
    if (state is SuccessFetchChargesState) {
      final currentState = state as SuccessFetchChargesState;
      final updated = currentState.charges
          .where((c) => c.id != chargeId)
          .toList();
      state = FetchChargesState.success(charges: updated);
    }
  }
}

@riverpod
class CreateCharge extends _$CreateCharge {
  BillingRepository get _repo => ref.read(billingRepositoryProvider);

  @override
  CreateChargeState build() => const CreateChargeState.initial();

  Future<ChargeModel?> create(CreateChargePayload payload) async {
    try {
      state = const CreateChargeState.loading();
      final charge = await _repo.createCharge(payload);
      state = CreateChargeState.success(charge: charge);
      return charge;
    } catch (e) {
      state = CreateChargeState.error(message: e.toString());
      return null;
    }
  }

  Future<bool> delete({
    required String id,
    required String barnId,
    required String deletedBy,
  }) async {
    try {
      state = const CreateChargeState.loading();
      await _repo.deleteCharge(
        id: id,
        barnId: barnId,
        deletedBy: deletedBy,
      );
      state = const CreateChargeState.initial();
      return true;
    } catch (e) {
      state = CreateChargeState.error(message: e.toString());
      return false;
    }
  }

  void reset() {
    state = const CreateChargeState.initial();
  }
}
