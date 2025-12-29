import 'package:data_provider_client/data_provider_client.dart';
import 'package:models/models.dart';

/// Repository for managing billing, charges, and templates.
class BillingRepository {
  BillingRepository({required this.dataProviderClient});

  final DataProviderClient dataProviderClient;

  // ============ BILLING PERIODS ============

  /// Creates a new billing period.
  Future<BillingPeriodModel> createBillingPeriod(
      CreateBillingPeriodPayload payload) {
    return dataProviderClient.billingResource.createBillingPeriod(payload);
  }

  /// Gets billing periods for a client.
  Future<List<BillingPeriodModel>> getClientBillingPeriods({
    required String clientId,
    required String barnId,
    BillingPeriodStatus? statusFilter,
  }) {
    return dataProviderClient.billingResource.getClientBillingPeriods(
      clientId: clientId,
      barnId: barnId,
      statusFilter: statusFilter,
    );
  }

  /// Gets all billing periods for a barn.
  Future<List<BillingPeriodModel>> getBarnBillingPeriods({
    required String barnId,
    BillingPeriodStatus? statusFilter,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return dataProviderClient.billingResource.getBarnBillingPeriods(
      barnId: barnId,
      statusFilter: statusFilter,
      startDate: startDate,
      endDate: endDate,
    );
  }

  /// Gets a single billing period.
  Future<BillingPeriodModel> getBillingPeriod({
    required String id,
    required String barnId,
  }) {
    return dataProviderClient.billingResource.getBillingPeriod(
      id: id,
      barnId: barnId,
    );
  }

  /// Updates a billing period.
  Future<BillingPeriodModel> updateBillingPeriod(BillingPeriodModel period) {
    return dataProviderClient.billingResource.updateBillingPeriod(period);
  }

  /// Closes a billing period and generates invoice.
  Future<BillingPeriodModel> closeBillingPeriod({
    required String id,
    required String barnId,
  }) {
    return dataProviderClient.billingResource.closeBillingPeriod(
      id: id,
      barnId: barnId,
    );
  }

  // ============ CHARGES ============

  /// Creates a new charge.
  Future<ChargeModel> createCharge(CreateChargePayload payload) {
    return dataProviderClient.billingResource.createCharge(payload);
  }

  /// Gets charges for a billing period.
  Future<List<ChargeModel>> getPeriodCharges({
    required String billingPeriodId,
    required String barnId,
  }) {
    return dataProviderClient.billingResource.getPeriodCharges(
      billingPeriodId: billingPeriodId,
      barnId: barnId,
    );
  }

  /// Gets charges for a client.
  Future<List<ChargeModel>> getClientCharges({
    required String clientId,
    required String barnId,
    ChargeStatus? statusFilter,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return dataProviderClient.billingResource.getClientCharges(
      clientId: clientId,
      barnId: barnId,
      statusFilter: statusFilter,
      startDate: startDate,
      endDate: endDate,
    );
  }

  /// Gets a single charge.
  Future<ChargeModel> getCharge({
    required String id,
    required String barnId,
  }) {
    return dataProviderClient.billingResource.getCharge(
      id: id,
      barnId: barnId,
    );
  }

  /// Updates a charge.
  Future<ChargeModel> updateCharge(ChargeModel charge) {
    return dataProviderClient.billingResource.updateCharge(charge);
  }

  /// Deletes a charge.
  Future<void> deleteCharge({
    required String id,
    required String barnId,
    required String deletedBy,
  }) {
    return dataProviderClient.billingResource.deleteCharge(
      id: id,
      barnId: barnId,
      deletedBy: deletedBy,
    );
  }

  // ============ CLIENT TABS ============

  /// Gets a client's tab/balance overview.
  Future<ClientTabModel> getClientTab({
    required String clientId,
    required String barnId,
  }) {
    return dataProviderClient.billingResource.getClientTab(
      clientId: clientId,
      barnId: barnId,
    );
  }

  /// Gets all client tabs for a barn.
  Future<List<ClientTabModel>> getBarnClientTabs({
    required String barnId,
  }) {
    return dataProviderClient.billingResource.getBarnClientTabs(
      barnId: barnId,
    );
  }

  /// Recalculates a client's tab.
  Future<ClientTabModel> recalculateClientTab({
    required String clientId,
    required String barnId,
  }) {
    return dataProviderClient.billingResource.recalculateClientTab(
      clientId: clientId,
      barnId: barnId,
    );
  }

  // ============ BILLING TEMPLATES ============

  /// Creates a new billing template.
  Future<BillingTemplateModel> createBillingTemplate(
      CreateBillingTemplatePayload payload) {
    return dataProviderClient.billingResource.createBillingTemplate(payload);
  }

  /// Gets all billing templates for a barn.
  Future<List<BillingTemplateModel>> getBarnTemplates({
    required String barnId,
  }) {
    return dataProviderClient.billingResource.getBarnTemplates(
      barnId: barnId,
    );
  }

  /// Gets a single template.
  Future<BillingTemplateModel> getBillingTemplate({
    required String id,
    required String barnId,
  }) {
    return dataProviderClient.billingResource.getBillingTemplate(
      id: id,
      barnId: barnId,
    );
  }

  /// Updates a billing template.
  Future<BillingTemplateModel> updateBillingTemplate(
      BillingTemplateModel template) {
    return dataProviderClient.billingResource.updateBillingTemplate(template);
  }

  /// Deletes a billing template.
  Future<void> deleteBillingTemplate({
    required String id,
    required String barnId,
    required String deletedBy,
  }) {
    return dataProviderClient.billingResource.deleteBillingTemplate(
      id: id,
      barnId: barnId,
      deletedBy: deletedBy,
    );
  }

  /// Applies a template to create charges.
  Future<List<ChargeModel>> applyTemplate(ApplyTemplatePayload payload) {
    return dataProviderClient.billingResource.applyTemplate(payload);
  }
}
