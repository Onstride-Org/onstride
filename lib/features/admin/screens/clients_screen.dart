import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/admin/providers/delete_stable_owner/delete_stable_owner_provider.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';

class ClientsScreen extends ConsumerStatefulWidget {
  const ClientsScreen({super.key});

  static const String path = '/admin';
  static const String name = 'admin';

  @override
  ConsumerState<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends ConsumerState<ClientsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => ref.read(fetchAllOwnersProvider.notifier).fetchAllOwners(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(accountProvider).currentUser;
    final state = ref.watch(fetchAllOwnersProvider);

    _listenLoadingClientsError(context);

    return Scaffold(
      appBar: const GLAuthUserAppBar(),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GLWelcomeGreeting(user: user),

              GLSpaces.px20,

              Text(
                context.l10n.clients,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),

              GLSpaces.px16,

              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async {
                    await ref
                        .read(fetchAllOwnersProvider.notifier)
                        .fetchAllOwners(reload: true);
                  },
                  child: () {
                    final isLoadingFetch =
                        state.status == RequestStatus.loading;
                    final deleteState = ref.watch(deleteStableOwnerProvider);
                    final isDeleting =
                        deleteState == const DeleteStableOwnerState.loading();

                    if (isLoadingFetch || isDeleting) {
                      return const Center(
                        child: GLBouncingDotsIndicator(),
                      );
                    } else if (state.status == RequestStatus.error) {
                      return SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: SizedBox(
                          height: MediaQuery.of(context).size.height * 0.6,
                          child: Center(
                            child: _EmptyClients(
                              hasError: state.status == RequestStatus.error,
                            ),
                          ),
                        ),
                      );
                    } else {
                      return state.owners.isEmpty
                          ? SingleChildScrollView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              child: SizedBox(
                                height:
                                    MediaQuery.of(context).size.height * 0.6,
                                child: Center(
                                  child: _EmptyClients(
                                    hasError:
                                        state.status == RequestStatus.error,
                                  ),
                                ),
                              ),
                            )
                          : ListView.builder(
                              itemCount: state.owners.length,
                              itemBuilder: (context, index) {
                                final owner = state.owners[index];
                                final barn = state.ownerBarns[owner.id];
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 16),
                                  child: ClientCard(
                                    owner: owner,
                                    barn: barn,
                                    onDelete: (user) async {
                                      await ref
                                          .read(
                                            deleteStableOwnerProvider.notifier,
                                          )
                                          .deleteStableOwner(
                                            owner: user,
                                            reason:
                                                'Deleted by the system administrator',
                                          );
                                    },
                                  ),
                                );
                              },
                            );
                    }
                  }(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _listenLoadingClientsError(BuildContext context) {
    ref
      ..listen<FetchAllOwnersState>(
        fetchAllOwnersProvider,
        (previous, next) {
          if (next.status == RequestStatus.error) {
            context.showError(
              title: context.l10n.errorLoadingClients,
              subtitle: context.l10n.errorLoadingClientsDescription,
            );
          }
        },
      )
      ..listen<DeleteStableOwnerState>(
        deleteStableOwnerProvider,
        (previous, next) {
          next.when(
            initial: () {},
            loading: () {},
            success: () {
              context.showSuccess(
                title: context.l10n.deleteStableOwnerSuccess,
              );
              ref.read(fetchAllOwnersProvider.notifier).fetchAllOwners();
            },
            error: (message) {
              context.showError(
                title: context.l10n.deleteStableOwnerError,
                subtitle: message,
              );
            },
          );
        },
      );
  }
}

class _EmptyClients extends StatelessWidget {
  const _EmptyClients({required this.hasError});

  final bool hasError;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: NotResultsWidget.data(
          title: !hasError
              ? context.l10n.clientsEmptyStateTitle
              : context.l10n.errorLoadingClients,
          description: !hasError
              ? context.l10n.noClientsFoundDescription
              : context.l10n.couldNotLoadClientsDescription,
        ),
      ),
    );
  }
}
