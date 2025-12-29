import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/vendors/providers/providers.dart';
import 'package:gl_horses/features/vendors/widgets/widgets.dart';

class VendorsScreen extends ConsumerStatefulWidget {
  const VendorsScreen({required this.barnId, super.key});

  static const name = 'vendors';
  static const path = '/barns/:barnId/vendors';

  final String barnId;

  @override
  ConsumerState<VendorsScreen> createState() => _VendorsScreenState();
}

class _VendorsScreenState extends ConsumerState<VendorsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(fetchVendorsProvider.notifier).fetchForBarn(barnId: widget.barnId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(fetchVendorsProvider);
    final user = ref.watch(accountProvider).currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Vendors'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => _showSearchDialog(context),
          ),
        ],
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
                    .read(fetchVendorsProvider.notifier)
                    .fetchForBarn(barnId: widget.barnId),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        success: (vendors) {
          if (vendors.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.work_outline, size: 64, color: GLColors.neutral300),
                  GLSpaces.px16,
                  const Text('No vendors connected'),
                  GLSpaces.px8,
                  const Text(
                    'Invite veterinarians, farriers, and other service providers',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: GLColors.neutral500),
                  ),
                  GLSpaces.px24,
                  ElevatedButton.icon(
                    onPressed: () => _showInviteVendorDialog(context),
                    icon: const Icon(Icons.person_add_outlined),
                    label: const Text('Invite Vendor'),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 16),
            itemCount: vendors.length,
            itemBuilder: (context, index) {
              final vendor = vendors[index];
              return VendorCard(
                vendor: vendor,
                onTap: () {
                  // TODO: Navigate to vendor detail
                },
                // For now, allow any user to remove vendors
                // In future, check barn role permissions
                onRemove: () => _confirmRemoveVendor(context, vendor.id),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showInviteVendorDialog(context),
        label: const Text('Invite Vendor'),
        icon: const Icon(Icons.person_add_outlined),
      ),
    );
  }

  Future<void> _showSearchDialog(BuildContext context) async {
    // TODO: Implement vendor search
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Search functionality coming soon')),
    );
  }

  Future<void> _showInviteVendorDialog(BuildContext context) async {
    // TODO: Implement invite vendor dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Invite vendor functionality coming soon')),
    );
  }

  Future<void> _confirmRemoveVendor(BuildContext context, String barnVendorId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Vendor'),
        content: const Text(
          'Are you sure you want to remove this vendor from your barn?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: GLColors.error600),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final user = ref.read(accountProvider).currentUser;
      await ref.read(fetchVendorsProvider.notifier).removeVendor(
            barnVendorId: barnVendorId,
            removedBy: user.id,
          );
    }
  }
}
