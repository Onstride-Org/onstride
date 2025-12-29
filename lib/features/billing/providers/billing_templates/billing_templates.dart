import 'package:billing_repository/billing_repository.dart';
import 'package:gl_horses/core/config/dependency_injection/repository/repository_providers.dart';
import 'package:gl_horses/features/billing/providers/billing_templates/billing_templates_state.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'billing_templates.g.dart';

@riverpod
class FetchBillingTemplates extends _$FetchBillingTemplates {
  BillingRepository get _repo => ref.read(billingRepositoryProvider);

  @override
  FetchBillingTemplatesState build() =>
      const FetchBillingTemplatesState.initial();

  Future<void> fetchForBarn({required String barnId}) async {
    try {
      state = const FetchBillingTemplatesState.loading();
      final templates = await _repo.getBarnTemplates(barnId: barnId);
      state = FetchBillingTemplatesState.success(templates: templates);
    } catch (e) {
      state = FetchBillingTemplatesState.error(message: e.toString());
    }
  }

  void addTemplate(BillingTemplateModel template) {
    if (state is SuccessFetchBillingTemplatesState) {
      final currentState = state as SuccessFetchBillingTemplatesState;
      state = FetchBillingTemplatesState.success(
        templates: [template, ...currentState.templates],
      );
    }
  }

  void updateTemplate(BillingTemplateModel template) {
    if (state is SuccessFetchBillingTemplatesState) {
      final currentState = state as SuccessFetchBillingTemplatesState;
      final updated = currentState.templates
          .map((t) => t.id == template.id ? template : t)
          .toList();
      state = FetchBillingTemplatesState.success(templates: updated);
    }
  }

  void removeTemplate(String templateId) {
    if (state is SuccessFetchBillingTemplatesState) {
      final currentState = state as SuccessFetchBillingTemplatesState;
      final updated = currentState.templates
          .where((t) => t.id != templateId)
          .toList();
      state = FetchBillingTemplatesState.success(templates: updated);
    }
  }
}

@riverpod
class ManageBillingTemplate extends _$ManageBillingTemplate {
  BillingRepository get _repo => ref.read(billingRepositoryProvider);

  @override
  ManageTemplateState build() => const ManageTemplateState.initial();

  Future<BillingTemplateModel?> create(
      CreateBillingTemplatePayload payload) async {
    try {
      state = const ManageTemplateState.loading();
      final template = await _repo.createBillingTemplate(payload);
      state = ManageTemplateState.success(template: template);
      return template;
    } catch (e) {
      state = ManageTemplateState.error(message: e.toString());
      return null;
    }
  }

  Future<BillingTemplateModel?> update(BillingTemplateModel template) async {
    try {
      state = const ManageTemplateState.loading();
      final updated = await _repo.updateBillingTemplate(template);
      state = ManageTemplateState.success(template: updated);
      return updated;
    } catch (e) {
      state = ManageTemplateState.error(message: e.toString());
      return null;
    }
  }

  Future<bool> delete({
    required String id,
    required String barnId,
    required String deletedBy,
  }) async {
    try {
      state = const ManageTemplateState.loading();
      await _repo.deleteBillingTemplate(
        id: id,
        barnId: barnId,
        deletedBy: deletedBy,
      );
      state = const ManageTemplateState.deleted();
      return true;
    } catch (e) {
      state = ManageTemplateState.error(message: e.toString());
      return false;
    }
  }

  void reset() {
    state = const ManageTemplateState.initial();
  }
}

@riverpod
class ApplyBillingTemplate extends _$ApplyBillingTemplate {
  BillingRepository get _repo => ref.read(billingRepositoryProvider);

  @override
  ApplyTemplateState build() => const ApplyTemplateState.initial();

  Future<List<ChargeModel>?> apply(ApplyTemplatePayload payload) async {
    try {
      state = const ApplyTemplateState.loading();
      final charges = await _repo.applyTemplate(payload);
      state = ApplyTemplateState.success(charges: charges);
      return charges;
    } catch (e) {
      state = ApplyTemplateState.error(message: e.toString());
      return null;
    }
  }

  void reset() {
    state = const ApplyTemplateState.initial();
  }
}
