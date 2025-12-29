import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/multi_barn/providers/providers.dart';
import 'package:gl_horses/features/multi_barn/widgets/widgets.dart';
import 'package:models/models.dart';

class HorseTransfersScreen extends ConsumerStatefulWidget {
  const HorseTransfersScreen({required this.barnId, super.key});

  static const name = 'horse-transfers';
  static const path = '/barns/:barnId/transfers';

  final String barnId;

  @override
  ConsumerState<HorseTransfersScreen> createState() =>
      _HorseTransfersScreenState();
}

class _HorseTransfersScreenState extends ConsumerState<HorseTransfersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(horseTransfersProvider.notifier).fetch(barnId: widget.barnId);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(horseTransfersProvider);
    final user = ref.watch(accountProvider).currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Horse Transfers'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Pending'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: state.when(
        initial: () => const Center(child: CircularProgressIndicator()),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (message) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: GLColors.error500),
              GLSpaces.px16,
              Text(message),
              GLSpaces.px16,
              ElevatedButton(
                onPressed: () => ref
                    .read(horseTransfersProvider.notifier)
                    .fetch(barnId: widget.barnId),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        success: (pendingTransfers, transferHistory) {
          return TabBarView(
            controller: _tabController,
            children: [
              _TransfersList(
                transfers: pendingTransfers,
                barnId: widget.barnId,
                emptyMessage: 'No pending transfers',
                emptyIcon: Icons.swap_horiz,
              ),
              _TransfersList(
                transfers: transferHistory,
                barnId: widget.barnId,
                emptyMessage: 'No transfer history',
                emptyIcon: Icons.history,
                isHistory: true,
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showInitiateTransferDialog(context),
        label: const Text('New Transfer'),
        icon: const Icon(Icons.swap_horiz),
      ),
    );
  }

  Future<void> _showInitiateTransferDialog(BuildContext context) async {
    // TODO: Implement initiate transfer dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Initiate transfer functionality coming soon'),
      ),
    );
  }
}

class _TransfersList extends ConsumerWidget {
  const _TransfersList({
    required this.transfers,
    required this.barnId,
    required this.emptyMessage,
    required this.emptyIcon,
    this.isHistory = false,
  });

  final List<HorseTransfer> transfers;
  final String barnId;
  final String emptyMessage;
  final IconData emptyIcon;
  final bool isHistory;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (transfers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(emptyIcon, size: 64, color: GLColors.neutral300),
            GLSpaces.px16,
            Text(emptyMessage),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 16),
      itemCount: transfers.length,
      itemBuilder: (context, index) {
        final transfer = transfers[index];
        final isIncoming = transfer.toBarnId == barnId;
        final user = ref.read(accountProvider).currentUser;

        return TransferRequestCard(
          transfer: transfer,
          isIncoming: isIncoming,
          onApprove: isHistory
              ? null
              : () {
                  ref.read(horseTransfersProvider.notifier).respondToTransfer(
                        RespondToTransferPayload(
                          transferId: transfer.id,
                          approved: true,
                          respondedBy: user.id,
                        ),
                      );
                },
          onReject: isHistory
              ? null
              : () {
                  ref.read(horseTransfersProvider.notifier).respondToTransfer(
                        RespondToTransferPayload(
                          transferId: transfer.id,
                          approved: false,
                          respondedBy: user.id,
                        ),
                      );
                },
          onComplete: transfer.status == TransferStatus.approved
              ? () {
                  ref.read(horseTransfersProvider.notifier).completeTransfer(
                        transferId: transfer.id,
                      );
                }
              : null,
        );
      },
    );
  }
}
