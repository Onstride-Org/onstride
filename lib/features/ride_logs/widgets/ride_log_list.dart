import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/ride_logs/providers/providers.dart';
import 'package:gl_horses/features/ride_logs/widgets/add_edit_ride_log_dialog.dart';
import 'package:gl_horses/features/ride_logs/widgets/ride_log_card.dart';
import 'package:gl_horses/features/ride_logs/widgets/ride_log_summary_card.dart';
import 'package:models/models.dart';

class RideLogList extends ConsumerStatefulWidget {
  const RideLogList({
    required this.horseId,
    required this.barnId,
    super.key,
  });

  final String horseId;
  final String barnId;

  @override
  ConsumerState<RideLogList> createState() => _RideLogListState();
}

class _RideLogListState extends ConsumerState<RideLogList> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(fetchRideLogsProvider.notifier).fetchForHorse(
        horseId: widget.horseId,
        barnId: widget.barnId,
      );
    });
  }

  Future<void> _addRideLog() async {
    final result = await AddEditRideLogDialog.show(
      context,
      horseId: widget.horseId,
      barnId: widget.barnId,
    );
    if (result != null) {
      ref.read(fetchRideLogsProvider.notifier).addRideLog(result);
    }
  }

  Future<void> _editRideLog(RideLogModel rideLog) async {
    final result = await AddEditRideLogDialog.show(
      context,
      horseId: widget.horseId,
      barnId: widget.barnId,
      rideLog: rideLog,
    );
    if (result != null) {
      ref.read(fetchRideLogsProvider.notifier).updateRideLog(result);
    }
  }

  Future<void> _deleteRideLog(RideLogModel rideLog) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Ride Log'),
        content: const Text('Are you sure you want to delete this ride log?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final user = ref.read(accountProvider).currentUser;
      final success = await ref.read(createRideLogProvider.notifier).delete(
        id: rideLog.id,
        horseId: rideLog.horseId,
        deletedBy: user.id,
      );
      if (success) {
        ref.read(fetchRideLogsProvider.notifier).removeRideLog(rideLog.id);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(fetchRideLogsProvider);
    final user = ref.watch(accountProvider).currentUser;
    final canEdit = user.isOwner || user.canManageHorses;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Ride Log',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            if (canEdit)
              TextButton.icon(
                onPressed: _addRideLog,
                icon: const Icon(Icons.add),
                label: const Text('Add'),
              ),
          ],
        ),
        GLSpaces.px16,
        _buildContent(state, canEdit),
      ],
    );
  }

  Widget _buildContent(FetchRideLogsState state, bool canEdit) {
    return switch (state) {
      InitialFetchRideLogsState() => const SizedBox.shrink(),
      LoadingFetchRideLogsState() => const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: GLBouncingDotsIndicator(),
        ),
      ),
      ErrorFetchRideLogsState(:final message) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'Error: $message',
            style: const TextStyle(color: Colors.red),
          ),
        ),
      ),
      SuccessFetchRideLogsState(:final rideLogs, :final summary) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (summary != null) ...[
            RideLogSummaryCard(summary: summary),
            GLSpaces.px16,
          ],
          if (rideLogs.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Text('No ride logs yet. Add your first ride!'),
            )
          else
            ...rideLogs.map(
              (log) => RideLogCard(
                rideLog: log,
                onEdit: canEdit ? () => _editRideLog(log) : null,
                onDelete: canEdit ? () => _deleteRideLog(log) : null,
              ),
            ),
        ],
      ),
    };
  }
}
