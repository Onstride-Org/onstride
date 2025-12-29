import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

/// A card widget that displays vendor appointment information.
class AppointmentCard extends StatelessWidget {
  const AppointmentCard({
    required this.appointment,
    this.onTap,
    this.onConfirm,
    this.onCancel,
    super.key,
  });

  final VendorAppointment appointment;
  final VoidCallback? onTap;
  final VoidCallback? onConfirm;
  final VoidCallback? onCancel;

  IconData _getVendorIcon() {
    // Use service name to guess vendor type, or default to work icon
    final serviceName = appointment.serviceName?.toLowerCase() ?? '';
    if (serviceName.contains('vet') || serviceName.contains('medical')) {
      return Icons.medical_services_outlined;
    } else if (serviceName.contains('farrier') || serviceName.contains('shoe')) {
      return Icons.handyman_outlined;
    } else if (serviceName.contains('dent')) {
      return Icons.medical_information_outlined;
    }
    return Icons.work_outline;
  }

  @override
  Widget build(BuildContext context) {
    final durationText = appointment.durationMinutes != null
        ? '${appointment.durationMinutes} min'
        : 'TBD';
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              _getVendorIcon(),
                              size: 18,
                              color: GLColors.brand600,
                            ),
                            GLSpaces.px8,
                            Text(
                              appointment.vendorName ?? 'Unknown Vendor',
                              style: context.bodyLarge.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        if (appointment.serviceName != null) ...[
                          GLSpaces.px4,
                          Text(
                            appointment.serviceName!,
                            style: context.bodyMedium.copyWith(
                              color: GLColors.neutral600,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  _StatusChip(status: appointment.status),
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
                      icon: Icons.calendar_today,
                      label: DateFormat.yMMMd().format(appointment.scheduledAt),
                    ),
                    GLSpaces.px8,
                    _InfoRow(
                      icon: Icons.access_time,
                      label:
                          '${DateFormat.jm().format(appointment.scheduledAt)} ($durationText)',
                    ),
                    if (appointment.horseNames.isNotEmpty) ...[
                      GLSpaces.px8,
                      _InfoRow(
                        icon: Icons.pets,
                        label: appointment.horseNames.join(', '),
                      ),
                    ],
                  ],
                ),
              ),
              if (appointment.barnNotes != null) ...[
                GLSpaces.px12,
                Text(
                  appointment.barnNotes!,
                  style: context.bodySmall.copyWith(
                    color: GLColors.neutral500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              if (appointment.status == AppointmentStatus.requested &&
                  (onConfirm != null || onCancel != null)) ...[
                GLSpaces.px16,
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (onCancel != null)
                      OutlinedButton(
                        onPressed: onCancel,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: GLColors.error600,
                          side: const BorderSide(color: GLColors.error600),
                        ),
                        child: const Text('Cancel'),
                      ),
                    if (onCancel != null && onConfirm != null) GLSpaces.px12,
                    if (onConfirm != null)
                      ElevatedButton(
                        onPressed: onConfirm,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: GLColors.brand600,
                        ),
                        child: const Text('Confirm'),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final AppointmentStatus status;

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
      case AppointmentStatus.requested:
        return 'Requested';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.inProgress:
        return 'In Progress';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.noShow:
        return 'No Show';
    }
  }

  Color _getBackgroundColor() {
    switch (status) {
      case AppointmentStatus.requested:
        return Colors.orange.withOpacity(0.1);
      case AppointmentStatus.confirmed:
        return GLColors.brand100;
      case AppointmentStatus.inProgress:
        return Colors.blue.withOpacity(0.1);
      case AppointmentStatus.completed:
        return GLColors.success100;
      case AppointmentStatus.cancelled:
        return GLColors.error100;
      case AppointmentStatus.noShow:
        return GLColors.neutral100;
    }
  }

  Color _getTextColor() {
    switch (status) {
      case AppointmentStatus.requested:
        return Colors.orange.shade700;
      case AppointmentStatus.confirmed:
        return GLColors.brand700;
      case AppointmentStatus.inProgress:
        return Colors.blue.shade700;
      case AppointmentStatus.completed:
        return GLColors.success700;
      case AppointmentStatus.cancelled:
        return GLColors.error700;
      case AppointmentStatus.noShow:
        return GLColors.neutral600;
    }
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: GLColors.neutral500),
        GLSpaces.px8,
        Expanded(
          child: Text(
            label,
            style: context.bodySmall.copyWith(
              color: GLColors.neutral600,
            ),
          ),
        ),
      ],
    );
  }
}
