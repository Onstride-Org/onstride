part of 'app_router.dart';

List<GoRoute> routes = [
  GoRoute(
    path: SplashScreen.path,
    name: SplashScreen.name,
    builder: (_, _) {
      return const SplashScreen();
    },
  ),
  GoRoute(
    path: LoginScreen.path,
    name: LoginScreen.name,
    builder: (_, _) {
      return const LoginScreen();
    },
  ),
  GoRoute(
    path: CreateAccountScreen.path,
    name: CreateAccountScreen.name,
    builder: (_, state) {
      final request = state.extra as CreateAccountRequest?;
      return CreateAccountScreen(request: request);
    },
  ),
  GoRoute(
    path: CreateAccountInvitationScreen.path,
    name: CreateAccountInvitationScreen.name,
    builder: (_, state) {
      final id = state.uri.queryParameters['invitationId'];
      return CreateAccountInvitationScreen(invitationId: id.toString());
    },
  ),
  GoRoute(
    path: CompleteAccountScreen.path,
    name: CompleteAccountScreen.name,
    builder: (_, state) {
      final user = state.extra! as GLUser;
      return CompleteAccountScreen(user: user);
    },
  ),
  GoRoute(
    path: ResetPasswordScreen.path,
    name: ResetPasswordScreen.name,
    builder: (_, state) {
      final email = state.uri.queryParameters['email'];
      return ResetPasswordScreen(email: email ?? '');
    },
  ),
  GoRoute(
    path: HomeScreen.path,
    name: HomeScreen.name,
    builder: (_, _) {
      return const HomeScreen();
    },
    routes: [
      GoRoute(
        path: InvoicesScreen.path,
        name: InvoicesScreen.name,
        builder: (_, state) {
          final boarderId = state.pathParameters['boarderId'];
          return InvoicesScreen(boarderId: boarderId);
        },
        routes: [
          GoRoute(
            path: InvoiceDetailViewScreen.path,
            name: InvoiceDetailViewScreen.name,
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return InvoiceDetailViewScreen(invoiceId: id);
            },
          ),
          GoRoute(
            path: InvoiceReceiptScreen.path,
            name: InvoiceReceiptScreen.name,
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return InvoiceReceiptScreen(invoiceId: id);
            },
          ),
        ],
      ),
      GoRoute(
        path: InvoiceDetailViewScreen.path,
        name: InvoiceDetailViewScreen.nameForHome,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return InvoiceDetailViewScreen(invoiceId: id);
        },
      ),
      GoRoute(
        path: UsersScreen.path,
        name: UsersScreen.name,
        builder: (_, _) {
          return const UsersScreen();
        },
      ),
      GoRoute(
        path: HorseProfileView.path,
        name: HorseProfileView.name,
        builder: (context, state) {
          final horseId = state.pathParameters['id']!;
          return HorseProfileView(horseId: horseId);
        },
      ),
      GoRoute(
        path: CreateEditInvoiceScreen.path,
        name: CreateEditInvoiceScreen.name,
        builder: (context, state) {
          final invoice = state.extra as InvoiceModel?;
          return CreateEditInvoiceScreen(invoice: invoice);
        },
      ),
      GoRoute(
        path: ProfileScreen.path,
        name: ProfileScreen.name,
        builder: (_, _) {
          return const ProfileScreen();
        },
      ),
    ],
  ),
  GoRoute(
    path: ForceUpgradeScreen.path,
    name: ForceUpgradeScreen.name,
    builder: (_, _) {
      return const ForceUpgradeScreen();
    },
  ),

  GoRoute(
    path: DownForMaintenanceScreen.path,
    name: DownForMaintenanceScreen.name,
    builder: (_, _) {
      return const DownForMaintenanceScreen();
    },
  ),
];
