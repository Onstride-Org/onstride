import 'package:flutter/material.dart';
import 'package:models/models.dart';

import '../services/services.dart';
import '../widgets/widgets.dart';

/// Main admin dashboard screen
class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _selectedTabIndex = 0;

  // Sample data for demonstration
  final _analytics = PlatformAnalytics(
    id: 'analytics_1',
    totalBarns: 156,
    totalUsers: 1247,
    totalHorses: 3891,
    activeUsersToday: 423,
    activeUsersThisWeek: 892,
    activeUsersThisMonth: 1105,
    newBarnsThisMonth: 12,
    newUsersThisMonth: 89,
    subscriptionsByTier: {
      'free': 78,
      'basic': 45,
      'pro': 28,
      'enterprise': 5,
    },
    revenueThisMonth: 1589500,
    createdAt: DateTime.now(),
  );

  final _announcements = <SystemAnnouncement>[
    SystemAnnouncement(
      id: 'ann_1',
      title: 'Scheduled Maintenance',
      message: 'We will be performing maintenance on January 5th from 2-4 AM EST.',
      type: AnnouncementType.maintenance,
      isActive: true,
      createdBy: 'admin',
      startsAt: DateTime.now(),
      expiresAt: DateTime.now().add(const Duration(days: 7)),
      createdAt: DateTime.now(),
    ),
    SystemAnnouncement(
      id: 'ann_2',
      title: 'New AI Features Available',
      message: 'Check out our new AI-powered scheduling and document scanning features!',
      type: AnnouncementType.feature,
      isActive: true,
      createdBy: 'admin',
      startsAt: DateTime.now(),
      expiresAt: DateTime.now().add(const Duration(days: 30)),
      createdAt: DateTime.now(),
    ),
  ];

  final _featureFlags = <FeatureFlag>[
    FeatureFlag(
      id: 'ff_1',
      name: 'AI Scheduling',
      description: 'Enable AI-powered scheduling suggestions',
      isEnabled: true,
      enabledForTiers: ['pro', 'enterprise'],
      rolloutPercentage: 100,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    FeatureFlag(
      id: 'ff_2',
      name: 'Breeding Analysis',
      description: 'Enable breeding compatibility analysis',
      isEnabled: true,
      enabledForTiers: ['enterprise'],
      rolloutPercentage: 50,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    FeatureFlag(
      id: 'ff_3',
      name: 'Beta Features',
      description: 'Enable beta feature testing',
      isEnabled: false,
      rolloutPercentage: 10,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  ];

  final _tickets = <SupportTicket>[
    SupportTicket(
      id: 'ticket_1',
      userId: 'user_1',
      userName: 'John Smith',
      userEmail: 'john@example.com',
      barnId: 'barn_1',
      subject: 'Cannot upload documents',
      description: 'Getting an error when trying to upload PDF files to horse profiles.',
      category: 'technical',
      priority: TicketPriority.high,
      status: TicketStatus.inProgress,
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      updatedAt: DateTime.now(),
    ),
    SupportTicket(
      id: 'ticket_2',
      userId: 'user_2',
      userName: 'Sarah Johnson',
      userEmail: 'sarah@example.com',
      barnId: 'barn_2',
      subject: 'Billing question',
      description: 'I was charged twice for my subscription this month.',
      category: 'billing',
      priority: TicketPriority.urgent,
      status: TicketStatus.open,
      createdAt: DateTime.now().subtract(const Duration(hours: 1)),
      updatedAt: DateTime.now(),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _tabController.addListener(() {
      setState(() => _selectedTabIndex = _tabController.index);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final layout = ResponsiveService.getLayoutInfo(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        bottom: layout.isMobile
            ? TabBar(
                controller: _tabController,
                isScrollable: true,
                tabs: const [
                  Tab(text: 'Overview'),
                  Tab(text: 'Users'),
                  Tab(text: 'Flags'),
                  Tab(text: 'Announcements'),
                  Tab(text: 'Support'),
                ],
              )
            : null,
      ),
      body: layout.isMobile
          ? TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(),
                _buildUsersTab(),
                _buildFeatureFlagsTab(),
                _buildAnnouncementsTab(),
                _buildSupportTab(),
              ],
            )
          : Row(
              children: [
                NavigationRail(
                  selectedIndex: _selectedTabIndex,
                  onDestinationSelected: (index) {
                    setState(() => _selectedTabIndex = index);
                  },
                  labelType: NavigationRailLabelType.all,
                  destinations: const [
                    NavigationRailDestination(
                      icon: Icon(Icons.dashboard_outlined),
                      selectedIcon: Icon(Icons.dashboard),
                      label: Text('Overview'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.people_outlined),
                      selectedIcon: Icon(Icons.people),
                      label: Text('Users'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.flag_outlined),
                      selectedIcon: Icon(Icons.flag),
                      label: Text('Flags'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.campaign_outlined),
                      selectedIcon: Icon(Icons.campaign),
                      label: Text('Announce'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.support_agent_outlined),
                      selectedIcon: Icon(Icons.support_agent),
                      label: Text('Support'),
                    ),
                  ],
                ),
                const VerticalDivider(width: 1),
                Expanded(
                  child: IndexedStack(
                    index: _selectedTabIndex,
                    children: [
                      _buildOverviewTab(),
                      _buildUsersTab(),
                      _buildFeatureFlagsTab(),
                      _buildAnnouncementsTab(),
                      _buildSupportTab(),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: ResponsiveContent(
        child: Column(
          children: [
            PlatformAnalyticsCard(analytics: _analytics),
            const SizedBox(height: 16),
            SubscriptionBreakdownCard(analytics: _analytics),
          ],
        ),
      ),
    );
  }

  Widget _buildUsersTab() {
    final admins = [
      AdminUser(
        id: 'admin_1',
        userId: 'user_1',
        email: 'admin@onstride.com',
        name: 'System Admin',
        role: AdminRole.superAdmin,
        isActive: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      AdminUser(
        id: 'admin_2',
        userId: 'user_2',
        email: 'support@onstride.com',
        name: 'Support Agent',
        role: AdminRole.support,
        isActive: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: ResponsiveContent(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Admin Users',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                FilledButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.add),
                  label: const Text('Add Admin'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...admins.map((admin) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: AdminUserCard(admin: admin),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureFlagsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: ResponsiveContent(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Feature Flags',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                FilledButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.add),
                  label: const Text('Add Flag'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ..._featureFlags.map((flag) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: FeatureFlagCard(
                    flag: flag,
                    onToggle: (value) {
                      setState(() {
                        final index = _featureFlags.indexOf(flag);
                        _featureFlags[index] = flag.copyWith(isEnabled: value);
                      });
                    },
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildAnnouncementsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: ResponsiveContent(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'System Announcements',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                FilledButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.add),
                  label: const Text('New Announcement'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ..._announcements.map((announcement) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: SystemAnnouncementCard(announcement: announcement),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildSupportTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: ResponsiveContent(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Support Tickets',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            ..._tickets.map((ticket) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: SupportTicketCard(ticket: ticket),
                )),
          ],
        ),
      ),
    );
  }
}
