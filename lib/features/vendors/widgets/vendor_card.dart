import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:models/models.dart';

/// A card widget that displays vendor information.
class VendorCard extends StatelessWidget {
  const VendorCard({
    required this.vendor,
    this.onTap,
    this.onRemove,
    super.key,
  });

  final BarnVendor vendor;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    final vendorType = vendor.vendorType ?? VendorType.other;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: _getVendorTypeColor(vendorType)
                    .withValues(alpha: 0.2),
                child: Icon(
                  _getVendorTypeIcon(vendorType),
                  color: _getVendorTypeColor(vendorType),
                  size: 28,
                ),
              ),
              GLSpaces.px16,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      vendor.vendorName ?? 'Unknown Vendor',
                      style: context.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    GLSpaces.px4,
                    Row(
                      children: [
                        _VendorTypeChip(type: vendorType),
                        GLSpaces.px8,
                        _StatusIndicator(status: vendor.status),
                      ],
                    ),
                    if (vendor.notes != null) ...[
                      GLSpaces.px4,
                      Text(
                        vendor.notes!,
                        style: context.bodySmall.copyWith(
                          color: GLColors.neutral500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              if (onRemove != null)
                IconButton(
                  icon: const Icon(Icons.more_vert),
                  onPressed: () => _showOptions(context),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.remove_circle_outline,
                  color: GLColors.error600),
              title: const Text('Remove Vendor'),
              onTap: () {
                Navigator.pop(context);
                onRemove?.call();
              },
            ),
          ],
        ),
      ),
    );
  }

  IconData _getVendorTypeIcon(VendorType type) {
    switch (type) {
      case VendorType.veterinarian:
        return Icons.medical_services_outlined;
      case VendorType.farrier:
        return Icons.handyman_outlined;
      case VendorType.dentist:
        return Icons.medical_information_outlined;
      case VendorType.bodyworker:
        return Icons.spa_outlined;
      case VendorType.trainer:
        return Icons.sports_outlined;
      case VendorType.supplier:
        return Icons.inventory_2_outlined;
      case VendorType.transport:
        return Icons.local_shipping_outlined;
      case VendorType.photographer:
        return Icons.camera_alt_outlined;
      case VendorType.other:
        return Icons.work_outline;
    }
  }

  Color _getVendorTypeColor(VendorType type) {
    switch (type) {
      case VendorType.veterinarian:
        return Colors.red;
      case VendorType.farrier:
        return Colors.brown;
      case VendorType.dentist:
        return Colors.teal;
      case VendorType.bodyworker:
        return Colors.purple;
      case VendorType.trainer:
        return Colors.orange;
      case VendorType.supplier:
        return Colors.blue;
      case VendorType.transport:
        return Colors.green;
      case VendorType.photographer:
        return Colors.pink;
      case VendorType.other:
        return GLColors.neutral600;
    }
  }
}

class _VendorTypeChip extends StatelessWidget {
  const _VendorTypeChip({required this.type});

  final VendorType type;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: GLColors.neutral100,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _getTypeName(),
        style: context.bodySmall.copyWith(
          color: GLColors.neutral700,
        ),
      ),
    );
  }

  String _getTypeName() {
    switch (type) {
      case VendorType.veterinarian:
        return 'Vet';
      case VendorType.farrier:
        return 'Farrier';
      case VendorType.dentist:
        return 'Dentist';
      case VendorType.bodyworker:
        return 'Bodywork';
      case VendorType.trainer:
        return 'Trainer';
      case VendorType.supplier:
        return 'Supplier';
      case VendorType.transport:
        return 'Transport';
      case VendorType.photographer:
        return 'Photo';
      case VendorType.other:
        return 'Other';
    }
  }
}

class _StatusIndicator extends StatelessWidget {
  const _StatusIndicator({required this.status});

  final VendorConnectionStatus status;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _getStatusColor(),
          ),
        ),
        GLSpaces.px4,
        Text(
          _getStatusText(),
          style: context.bodySmall.copyWith(
            color: _getStatusColor(),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor() {
    switch (status) {
      case VendorConnectionStatus.active:
        return GLColors.success600;
      case VendorConnectionStatus.pendingVendor:
      case VendorConnectionStatus.pendingBarn:
        return Colors.orange;
      case VendorConnectionStatus.suspended:
        return GLColors.error600;
      case VendorConnectionStatus.inactive:
        return GLColors.neutral400;
    }
  }

  String _getStatusText() {
    switch (status) {
      case VendorConnectionStatus.active:
        return 'Active';
      case VendorConnectionStatus.pendingVendor:
        return 'Pending (Vendor)';
      case VendorConnectionStatus.pendingBarn:
        return 'Pending (Barn)';
      case VendorConnectionStatus.suspended:
        return 'Suspended';
      case VendorConnectionStatus.inactive:
        return 'Inactive';
    }
  }
}
