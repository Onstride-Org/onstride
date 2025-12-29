import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/core/providers/notification_navigation/notification_navigation_provider.dart';
import 'package:gl_horses/core/providers/notification_navigation/notification_navigation_state.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/horses/providers/load_horses_options/load_horses_options_provider.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  static const path = '/home';
  static const name = 'home';

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with SingleTickerProviderStateMixin {
  final ValueNotifier<int> indexNotifier = ValueNotifier(0);
  TabController? _tabController;

  @override
  void dispose() {
    indexNotifier.dispose();
    _tabController?.dispose();
    super.dispose();
  }

  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => ref.read(loadHorsesOptionsProvider.notifier).load(),
    );
    WidgetsBinding.instance.addPostFrameCallback(
      (_) async {
        final container = ProviderScope.containerOf(context);
        await ref
            .read(pushNotificationsServiceProvider)
            .checkInitialNotificationDetails(container: container);
      },
    );
    super.initState();
  }

  void _initializeTabController() {
    final user = ref.read(accountProvider).currentUser;
    _tabController = TabController(length: user.homeOptionsLength, vsync: this);
    _tabController?.addListener(() {
      if (_tabController!.index != indexNotifier.value) {
        indexNotifier.value = _tabController!.index;
      }
    });
  }

  Future<void> appStateListener(AppState? previous, AppState next) async {
    switch (next) {
      case UnauthenticatedAppState():
        await Future<void>.delayed(const Duration(seconds: 1));
        if (mounted) {
          return context.goNamed(LoginScreen.name);
        }
      case NeedsToFinishRegistrationAppState():
        return context.goNamed(CreateAccountScreen.name);
      case DownForMaintenance():
        return context.goNamed(DownForMaintenanceScreen.name);
      case ForceUpgradeRequired():
        return context.goNamed(ForceUpgradeScreen.name);
      default:
        return;
    }
  }

  void _handleNotificationNavigation(
    NotificationNavigationState? previous,
    NotificationNavigationState next,
  ) {
    if (!mounted) return;

    if (next is InitialNotificationNavigationState) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      switch (next) {
        case NavigateToTaskState(
          :final shouldNavigateToHome,
          :final shouldSelectTaskTab,
        ):
          if (shouldNavigateToHome) {
            context.goNamed(HomeScreen.name);
          }
          if (shouldSelectTaskTab) {
            if (_tabController == null) {
              _initializeTabController();
            }
            if (_tabController != null) {
              final user = ref.read(accountProvider).currentUser;
              final taskTabIndex = _getTaskTabIndex(user);
              if (taskTabIndex != -1) {
                _tabController!.animateTo(taskTabIndex);
              }
            }
          }
          ref.read(notificationNavigationProvider.notifier).reset();
        case TaskNotFoundState():
          context.showError(
            title: context.l10n.taskNotFound,
            subtitle: context.l10n.taskNotFoundDescription,
          );
          context.goNamed(HomeScreen.name);
          ref.read(notificationNavigationProvider.notifier).reset();

        case NavigateToInvoiceState():
          ref
              .read(fetchInvoicesProvider.notifier)
              .fetchInvoiceById(next.invoiceId, next.barnId);
          context.goNamed(
            InvoiceDetailViewScreen.nameForHome,
            pathParameters: {'id': next.invoiceId},
          );
          ref.read(notificationNavigationProvider.notifier).reset();

        case InitialNotificationNavigationState():
          break;
      }
    });
  }

  int _getTaskTabIndex(GLUser user) {
    if (user.canManageHorses) {
      return 1;
    }

    return 0;
  }

  @override
  Widget build(BuildContext context) {
    ref
      ..listen(appStateProvider, appStateListener)
      ..listen(notificationNavigationProvider, _handleNotificationNavigation);
    final state = ref.watch(accountProvider);
    final user = state.currentUser;
    final isUnassigned = user.barnId == null;

    if (_tabController == null) {
      _initializeTabController();
    }
    return Scaffold(
      body: _getBodyContent(user, isUnassigned),
      bottomNavigationBar: _shouldShowBottomNavigation(user, isUnassigned)
          ? ValueListenableBuilder<int>(
              valueListenable: indexNotifier,
              builder: (_, index, _) {
                return GLBottomTabNavigationBar(
                  index: index,
                  tabController: _tabController,
                  onTap: (value) {
                    indexNotifier.value = value;
                    _tabController?.animateTo(value);
                  },
                );
              },
            )
          : null,
    );
  }

  bool _shouldShowBottomNavigation(GLUser user, bool isUnassigned) {
    if (user.isAdmin) return false;

    if (user.isOwner) return true;

    if (isUnassigned) return false;

    return true;
    // if (user.isManager) {
    //   return user.hasManagementPermissions;
    // }
    //
    // if (user.isGroomer) {
    //   return user.hasManagementPermissions;
    // }
    //
    // return user.permissions.isNotEmpty;
  }

  Widget _getBodyContent(GLUser user, bool isUnassigned) {
    if (user.isAdmin) {
      return const ClientsScreen();
    }

    if (isUnassigned && !user.isOwner) {
      return _UnassignedUserScreen(
        refresh: () => ref.read(accountProvider.notifier).loadUser(user.id),
      );
    }

    if (user.isManager && !user.hasManagementPermissions) {
      return const TaskScreen(showGreeting: true);
    }

    if (user.isGroomer && !user.hasManagementPermissions) {
      return const TaskScreen(showGreeting: true);
    }

    return _HomePageContent(tabController: _tabController);
  }
}

class _HomePageContent extends ConsumerWidget {
  const _HomePageContent({required this.tabController});

  final TabController? tabController;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(accountProvider).currentUser;
    final barn = ref.watch(accountProvider).currentBarn;
    final screens = <Widget>[];

    if (user.canManageHorses) {
      screens.add(const HorsesScreenView());
    }
    screens
      ..add(const TaskScreen())
      ..add(BarnSetupPage(initialIndex: barn?.setup != null ? 2 : 0));
    if (user.canGenerateInvoices) {
      screens.add(const InvoicesScreen());
    }

    if (screens.isNotEmpty) {
      final firstScreen = screens[0];
      screens[0] = _createScreenWithGreeting(firstScreen, barn);
    }

    return TabBarView(
      controller: tabController,
      physics: const NeverScrollableScrollPhysics(),
      children: screens,
    );
  }

  Widget _createScreenWithGreeting(Widget screen, BarnModel? barn) {
    switch (screen) {
      case HorsesScreenView _:
        return const HorsesScreenView(showGreeting: true);
      case TaskScreen _:
        return const TaskScreen(showGreeting: true);
      case BarnSetupPage _:
        return BarnSetupPage(
          initialIndex: barn?.setup != null ? 2 : 0,
          showGreeting: true,
        );
      case InvoicesScreen _:
        return const InvoicesScreen(showGreeting: true);
      default:
        return screen;
    }
  }
}

class _UnassignedUserScreen extends StatelessWidget {
  const _UnassignedUserScreen({required this.refresh});

  final void Function()? refresh;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GLAuthUserAppBar(),
      body: NotResultsWidget.data(
        title: context.l10n.noBarnAssigned,
        description: context.l10n.noBarnAssignedDescription,
        refresh: refresh,
      ),
    );
  }
}
