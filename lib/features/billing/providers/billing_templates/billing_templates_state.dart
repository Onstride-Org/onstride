import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'billing_templates_state.freezed.dart';

@freezed
sealed class FetchBillingTemplatesState with _$FetchBillingTemplatesState {
  const factory FetchBillingTemplatesState.initial() =
      InitialFetchBillingTemplatesState;
  const factory FetchBillingTemplatesState.loading() =
      LoadingFetchBillingTemplatesState;
  const factory FetchBillingTemplatesState.success({
    required List<BillingTemplateModel> templates,
  }) = SuccessFetchBillingTemplatesState;
  const factory FetchBillingTemplatesState.error({required String message}) =
      ErrorFetchBillingTemplatesState;
}

@freezed
sealed class ManageTemplateState with _$ManageTemplateState {
  const factory ManageTemplateState.initial() = InitialManageTemplateState;
  const factory ManageTemplateState.loading() = LoadingManageTemplateState;
  const factory ManageTemplateState.success({
    required BillingTemplateModel template,
  }) = SuccessManageTemplateState;
  const factory ManageTemplateState.deleted() = DeletedManageTemplateState;
  const factory ManageTemplateState.error({required String message}) =
      ErrorManageTemplateState;
}

@freezed
sealed class ApplyTemplateState with _$ApplyTemplateState {
  const factory ApplyTemplateState.initial() = InitialApplyTemplateState;
  const factory ApplyTemplateState.loading() = LoadingApplyTemplateState;
  const factory ApplyTemplateState.success({
    required List<ChargeModel> charges,
  }) = SuccessApplyTemplateState;
  const factory ApplyTemplateState.error({required String message}) =
      ErrorApplyTemplateState;
}
