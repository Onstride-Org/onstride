import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/vendors/providers/fetch_vendors/fetch_vendors_state.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:vendors_repository/vendors_repository.dart';

part 'fetch_vendors.g.dart';

@riverpod
class FetchVendors extends _$FetchVendors {
  VendorsRepository get _repo => ref.read(vendorsRepositoryProvider);

  @override
  FetchVendorsState build() => const FetchVendorsState.initial();

  Future<void> fetchForBarn({required String barnId}) async {
    try {
      state = const FetchVendorsState.loading();
      final vendors = await _repo.getBarnVendors(barnId: barnId);
      state = FetchVendorsState.success(vendors: vendors);
    } catch (e) {
      state = FetchVendorsState.error(message: e.toString());
    }
  }

  Future<void> inviteVendor(InviteVendorPayload payload) async {
    try {
      final vendor = await _repo.inviteVendor(payload);
      if (state is SuccessFetchVendorsState) {
        final currentState = state as SuccessFetchVendorsState;
        state = FetchVendorsState.success(
          vendors: [...currentState.vendors, vendor],
        );
      }
    } catch (e) {
      state = FetchVendorsState.error(message: e.toString());
    }
  }

  Future<void> removeVendor({
    required String barnVendorId,
    required String removedBy,
  }) async {
    try {
      await _repo.removeBarnVendor(
        barnVendorId: barnVendorId,
        removedBy: removedBy,
      );
      if (state is SuccessFetchVendorsState) {
        final currentState = state as SuccessFetchVendorsState;
        state = FetchVendorsState.success(
          vendors: currentState.vendors
              .where((v) => v.id != barnVendorId)
              .toList(),
        );
      }
    } catch (e) {
      state = FetchVendorsState.error(message: e.toString());
    }
  }
}
