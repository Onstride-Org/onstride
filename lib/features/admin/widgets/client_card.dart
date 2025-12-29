import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class ClientCard extends StatelessWidget {
  const ClientCard({
    required this.owner,
    required this.barn,
    required this.onDelete,
    super.key,
  });

  final GLUser owner;
  final BarnModel? barn;
  final void Function(GLUser) onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: GLColors.neutral1100),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _CardHeader(
              owner: owner,
              onDelete: () => _showDeleteConfirmation(context),
            ),
            _CardDetails(
              owner: owner,
              barn: barn,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showDeleteConfirmation(BuildContext context) async {
    final deleted = await ConfirmDialog.show(
      context,
      title: '${context.l10n.deleteStableOwner}?',
      description: context.l10n.deleteStableOwnerConfirmation(
        owner.name ?? context.l10n.unknownUser,
      ),
      confirmText: context.l10n.delete,
    );
    if (deleted ?? false) {
      onDelete(owner);
    }
  }
}

class _CardHeader extends StatelessWidget {
  const _CardHeader({
    required this.owner,
    required this.onDelete,
  });

  final GLUser owner;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            owner.name ?? context.l10n.unknownUser,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.green[900],
              fontWeight: FontWeight.bold,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        InkWell(
          borderRadius: BorderRadius.circular(50),
          onTap: onDelete,
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 8,
              vertical: 4,
            ),
            child: Row(
              children: [
                const Icon(
                  GLIcons.delete,
                  size: 16,
                  color: Colors.red,
                ),
                const SizedBox(width: 4),
                Text(
                  context.l10n.delete,
                  style: const TextStyle(
                    color: Colors.red,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _CardDetails extends StatelessWidget {
  const _CardDetails({
    required this.owner,
    required this.barn,
  });

  final GLUser owner;
  final BarnModel? barn;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              GLIcons.stableoutlined,
              size: 16,
              color: GLColors.neutral400,
            ),
            GLSpaces.px8,
            Text(
              barn?.name ?? context.l10n.noStable,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: GLColors.neutral400,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        GLSpaces.px4,
        Text(
          owner.email ?? context.l10n.noEmail,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: GLColors.neutral600,
          ),
        ),
        GLSpaces.px4,
        Text(
          owner.phoneNumber ?? context.l10n.noPhone,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: GLColors.neutral600,
          ),
        ),
      ],
    );
  }
}
