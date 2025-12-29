import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:models/models.dart';
import 'package:intl/intl.dart';

/// A card widget that displays a horse transfer request.
class TransferRequestCard extends StatelessWidget {
  const TransferRequestCard({
    required this.transfer,
    required this.isIncoming,
    this.onApprove,
    this.onReject,
    this.onComplete,
    super.key,
  });

  final HorseTransfer transfer;
  final bool isIncoming;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  final VoidCallback? onComplete;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: GLColors.brand100,
                  child: const Icon(
                    Icons.swap_horiz,
                    color: GLColors.brand600,
                  ),
                ),
                GLSpaces.px16,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        transfer.horseName,
                        style: context.bodyLarge.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      GLSpaces.px4,
                      Text(
                        isIncoming
                            ? 'From: ${transfer.fromBarnName}'
                            : 'To: ${transfer.toBarnName}',
                        style: context.bodySmall.copyWith(
                          color: GLColors.neutral500,
                        ),
                      ),
                    ],
                  ),
                ),
                _StatusChip(status: transfer.status),
              ],
            ),
            GLSpaces.px12,
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: GLColors.neutral50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  _InfoRow(
                    label: 'Requested',
                    value: DateFormat.yMMMd().format(transfer.requestedAt),
                  ),
                  if (transfer.notes != null) ...[
                    GLSpaces.px8,
                    _InfoRow(
                      label: 'Notes',
                      value: transfer.notes!,
                    ),
                  ],
                  if (transfer.includeDocuments || transfer.includeRideLogs) ...[
                    GLSpaces.px8,
                    _InfoRow(
                      label: 'Includes',
                      value: [
                        if (transfer.includeDocuments) 'Documents',
                        if (transfer.includeRideLogs) 'Ride Logs',
                      ].join(', '),
                    ),
                  ],
                ],
              ),
            ),
            if (transfer.status == TransferStatus.pending && isIncoming) ...[
              GLSpaces.px16,
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    onPressed: onReject,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: GLColors.error600,
                      side: const BorderSide(color: GLColors.error600),
                    ),
                    child: const Text('Decline'),
                  ),
                  GLSpaces.px12,
                  ElevatedButton(
                    onPressed: onApprove,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: GLColors.brand600,
                    ),
                    child: const Text('Approve'),
                  ),
                ],
              ),
            ],
            if (transfer.status == TransferStatus.approved) ...[
              GLSpaces.px16,
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onComplete,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: GLColors.success600,
                  ),
                  child: const Text('Complete Transfer'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final TransferStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _getBackgroundColor(),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _getStatusText(),
        style: context.bodySmall.copyWith(
          color: _getTextColor(),
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  String _getStatusText() {
    switch (status) {
      case TransferStatus.pending:
        return 'Pending';
      case TransferStatus.approved:
        return 'Approved';
      case TransferStatus.rejected:
        return 'Rejected';
      case TransferStatus.completed:
        return 'Completed';
      case TransferStatus.cancelled:
        return 'Cancelled';
    }
  }

  Color _getBackgroundColor() {
    switch (status) {
      case TransferStatus.pending:
        return Colors.orange.withOpacity(0.1);
      case TransferStatus.approved:
        return GLColors.brand100;
      case TransferStatus.rejected:
        return GLColors.error100;
      case TransferStatus.completed:
        return GLColors.success100;
      case TransferStatus.cancelled:
        return GLColors.neutral100;
    }
  }

  Color _getTextColor() {
    switch (status) {
      case TransferStatus.pending:
        return Colors.orange.shade700;
      case TransferStatus.approved:
        return GLColors.brand700;
      case TransferStatus.rejected:
        return GLColors.error700;
      case TransferStatus.completed:
        return GLColors.success700;
      case TransferStatus.cancelled:
        return GLColors.neutral600;
    }
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: context.bodySmall.copyWith(
              color: GLColors.neutral500,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: context.bodySmall,
          ),
        ),
      ],
    );
  }
}
