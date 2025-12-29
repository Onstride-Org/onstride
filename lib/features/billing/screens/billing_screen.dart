import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/billing/providers/providers.dart';
import 'package:gl_horses/features/billing/screens/create_charge_screen.dart';
import 'package:gl_horses/features/billing/screens/create_template_screen.dart';
import 'package:gl_horses/features/billing/widgets/widgets.dart';
import 'package:go_router/go_router.dart';

/// Main billing management screen.
class BillingScreen extends ConsumerStatefulWidget {
  const BillingScreen({super.key});

  static String name = 'billing';
  static String path = '/billing';

  @override
  ConsumerState<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends ConsumerState<BillingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadData() {
    final account = ref.read(accountProvider);
    final barnId = account.currentUser.barnId ?? '';

    ref.read(fetchClientTabsProvider.notifier).fetchForBarn(barnId: barnId);
    ref.read(fetchBillingPeriodsProvider.notifier).fetchForBarn(barnId: barnId);
    ref.read(fetchBillingTemplatesProvider.notifier).fetchForBarn(barnId: barnId);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final tabsState = ref.watch(fetchClientTabsProvider);
    final periodsState = ref.watch(fetchBillingPeriodsProvider);
    final templatesState = ref.watch(fetchBillingTemplatesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.billing),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: l10n.clientBalances),
            Tab(text: l10n.billingPeriods),
            Tab(text: l10n.templates),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.add),
            onSelected: (value) {
              switch (value) {
                case 'charge':
                  context.push(CreateChargeScreen.path);
                  break;
                case 'template':
                  context.push(CreateTemplateScreen.path);
                  break;
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'charge',
                child: Text(l10n.addCharge),
              ),
              PopupMenuItem(
                value: 'template',
                child: Text(l10n.createTemplate),
              ),
            ],
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Client Balances Tab
          _buildClientTabsView(tabsState),
          // Billing Periods Tab
          _buildPeriodsView(periodsState),
          // Templates Tab
          _buildTemplatesView(templatesState),
        ],
      ),
    );
  }

  Widget _buildClientTabsView(FetchClientTabsState state) {
    return switch (state) {
      InitialFetchClientTabsState() => const Center(
          child: CircularProgressIndicator(),
        ),
      LoadingFetchClientTabsState() => const Center(
          child: CircularProgressIndicator(),
        ),
      SuccessFetchClientTabsState(:final tabs) => tabs.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.account_balance_wallet,
                      size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    context.l10n.noClientBalances,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            )
          : ClientTabsListView(tabs: tabs),
      ErrorFetchClientTabsState(:final message) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(message),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadData,
                child: Text(context.l10n.retry),
              ),
            ],
          ),
        ),
    };
  }

  Widget _buildPeriodsView(FetchBillingPeriodsState state) {
    return switch (state) {
      InitialFetchBillingPeriodsState() => const Center(
          child: CircularProgressIndicator(),
        ),
      LoadingFetchBillingPeriodsState() => const Center(
          child: CircularProgressIndicator(),
        ),
      SuccessFetchBillingPeriodsState(:final periods) => periods.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.date_range, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    context.l10n.noBillingPeriods,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            )
          : BillingPeriodsListView(periods: periods),
      ErrorFetchBillingPeriodsState(:final message) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(message),
            ],
          ),
        ),
    };
  }

  Widget _buildTemplatesView(FetchBillingTemplatesState state) {
    return switch (state) {
      InitialFetchBillingTemplatesState() => const Center(
          child: CircularProgressIndicator(),
        ),
      LoadingFetchBillingTemplatesState() => const Center(
          child: CircularProgressIndicator(),
        ),
      SuccessFetchBillingTemplatesState(:final templates) => templates.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.description, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    context.l10n.noTemplates,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: () => context.push(CreateTemplateScreen.path),
                    icon: const Icon(Icons.add),
                    label: Text(context.l10n.createTemplate),
                  ),
                ],
              ),
            )
          : TemplatesListView(templates: templates),
      ErrorFetchBillingTemplatesState(:final message) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(message),
            ],
          ),
        ),
    };
  }
}
