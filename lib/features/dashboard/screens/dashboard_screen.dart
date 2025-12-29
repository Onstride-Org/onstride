import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/tasks/providers/get_boarder_horses/get_boarder_horses_provider.dart';
import 'package:models/models.dart';

/// Main dashboard screen showing an overview for the user.
class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({
    this.showGreeting = false,
    super.key,
  });

  final bool showGreeting;

  static const path = '/dashboard';
  static const name = 'dashboard';

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final user = ref.read(accountProvider).currentUser;

    // Load tasks for today
    await ref.read(getTaskListProvider.notifier).getTasksForDate(
          date: DateTime.now(),
          groomId: user.accountType == AccountType.groomer ? user.id : null,
          boarderId: user.accountType == AccountType.boarder ? user.id : null,
          barnId: user.barnId,
        );

    // Load horses
    if (user.isOwner || user.canManageHorses) {
      await ref.read(fetchHorsesProvider.notifier).fetchAllHorses();
    } else if (user.isBoarder) {
      await ref.read(getBoarderHorsesProvider.notifier).load();
    }

    // Load users for admins
    if (user.isOwner || user.isManager) {
      await ref.read(fetchUsersProvider.notifier).fetchUsers();
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(accountProvider).currentUser;

    return Scaffold(
      appBar: const GLAuthUserAppBar(),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (widget.showGreeting) ...[
              GLWelcomeGreeting(user: user),
              GLSpaces.px8,
            ],

            // Quick actions
            const QuickActionsWidget(),
            GLSpaces.px16,

            // Barn summary for admins/owners
            if (user.isOwner || user.isManager) ...[
              const BarnSummaryWidget(),
              GLSpaces.px16,
            ],

            // Today's tasks
            const TodaysTasksWidget(),
            GLSpaces.px16,

            // Week calendar
            const WeekCalendarWidget(),
            GLSpaces.px24,

            // Boarder horses section (if boarder)
            if (user.isBoarder) ...[
              const BoarderHorsesSection(),
              GLSpaces.px24,
            ],
          ],
        ),
      ),
    );
  }
}
