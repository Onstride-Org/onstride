import 'package:models/models.dart';

/// {@template billing_resource}
/// Data source abstraction for managing billing, charges, and templates.
/// Responsible for:
///   - Managing billing periods
///   - Creating and tracking charges
///   - Managing client tabs/balances
///   - Creating and applying billing templates
/// {@endtemplate}
abstract class BillingResource {
  /// {@macro billing_resource}
  const BillingResource();

  // ============ BILLING PERIODS ============

  /// Creates a new billing period for a client.
  Future<BillingPeriodModel> createBillingPeriod(
      CreateBillingPeriodPayload payload);

  /// Gets all billing periods for a client.
  Future<List<BillingPeriodModel>> getClientBillingPeriods({
    required String clientId,
    required String barnId,
    BillingPeriodStatus? statusFilter,
  });

  /// Gets all billing periods for a barn.
  Future<List<BillingPeriodModel>> getBarnBillingPeriods({
    required String barnId,
    BillingPeriodStatus? statusFilter,
    DateTime? startDate,
    DateTime? endDate,
  });

  /// Gets a single billing period by ID.
  Future<BillingPeriodModel> getBillingPeriod({
    required String id,
    required String barnId,
  });

  /// Updates a billing period.
  Future<BillingPeriodModel> updateBillingPeriod(BillingPeriodModel period);

  /// Closes a billing period and generates invoice.
  Future<BillingPeriodModel> closeBillingPeriod({
    required String id,
    required String barnId,
  });

  // ============ CHARGES ============

  /// Creates a new charge.
  Future<ChargeModel> createCharge(CreateChargePayload payload);

  /// Gets charges for a billing period.
  Future<List<ChargeModel>> getPeriodCharges({
    required String billingPeriodId,
    required String barnId,
  });

  /// Gets charges for a client.
  Future<List<ChargeModel>> getClientCharges({
    required String clientId,
    required String barnId,
    ChargeStatus? statusFilter,
    DateTime? startDate,
    DateTime? endDate,
  });

  /// Gets a single charge by ID.
  Future<ChargeModel> getCharge({
    required String id,
    required String barnId,
  });

  /// Updates a charge.
  Future<ChargeModel> updateCharge(ChargeModel charge);

  /// Deletes a charge (soft delete).
  Future<void> deleteCharge({
    required String id,
    required String barnId,
    required String deletedBy,
  });

  // ============ CLIENT TABS ============

  /// Gets the client tab/balance overview.
  Future<ClientTabModel> getClientTab({
    required String clientId,
    required String barnId,
  });

  /// Gets all client tabs for a barn.
  Future<List<ClientTabModel>> getBarnClientTabs({
    required String barnId,
  });

  /// Recalculates and updates a client's tab.
  Future<ClientTabModel> recalculateClientTab({
    required String clientId,
    required String barnId,
  });

  // ============ BILLING TEMPLATES ============

  /// Creates a new billing template.
  Future<BillingTemplateModel> createBillingTemplate(
      CreateBillingTemplatePayload payload);

  /// Gets all billing templates for a barn.
  Future<List<BillingTemplateModel>> getBarnTemplates({
    required String barnId,
  });

  /// Gets a single template by ID.
  Future<BillingTemplateModel> getBillingTemplate({
    required String id,
    required String barnId,
  });

  /// Updates a billing template.
  Future<BillingTemplateModel> updateBillingTemplate(
      BillingTemplateModel template);

  /// Deletes a billing template (soft delete).
  Future<void> deleteBillingTemplate({
    required String id,
    required String barnId,
    required String deletedBy,
  });

  /// Applies a template to a client's billing period.
  Future<List<ChargeModel>> applyTemplate(ApplyTemplatePayload payload);
}
