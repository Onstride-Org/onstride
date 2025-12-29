import 'package:app_ui/app_ui.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/invitations/extensions/extensions.dart';
import 'package:gl_horses/features/invitations/providers/providers.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';
import 'package:share_plus/share_plus.dart';

class AddEditInvitationDialog extends ConsumerStatefulWidget {
  const AddEditInvitationDialog({super.key, this.invitation});

  final Invitation? invitation;

  static Future<Invitation?> show(
    BuildContext context, {
    Invitation? invitation,
  }) {
    return showModalBottomSheet<Invitation?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.backgroundColor,
      builder: (_) => AddEditInvitationDialog(invitation: invitation),
    );
  }

  @override
  ConsumerState<AddEditInvitationDialog> createState() =>
      _AddEditInvitationDialogState();
}

class _AddEditInvitationDialogState
    extends ConsumerState<AddEditInvitationDialog> {
  AccountType? selectedRole;
  List<PermissionRole> selectedPermissions = <PermissionRole>[];

  final List<AccountType> roles = [
    AccountType.groomer,
    AccountType.manager,
    AccountType.boarder,
  ];

  @override
  void initState() {
    super.initState();
    final invitation = widget.invitation;
    selectedRole = invitation?.accountType;
    selectedPermissions = List.of(invitation?.permissions ?? const []);
  }

  void _stateListener(
    CreateEditInvitationState? previous,
    CreateEditInvitationState next,
  ) {
    final isEditing = widget.invitation != null;

    switch (next) {
      case InitialCreateEditInvitationState():
        return;
      case LoadingCreateEditInvitationState():
        showInvisibleLoadingDialog(context);
        return;
      case SuccessCreateEditInvitationState(:final invitation):
        context
          ..pop()
          ..pop(invitation);

        final deeplink = invitation.deeplink(
          ref.read(flavorConfigProvider).appEnvironment,
        );
        SharePlus.instance.share(
          ShareParams(
            title: 'OnStride Invitation',
            text:
                'Hello! Tap the link below to download the OnStride app '
                'and join my barn ${invitation.barnName}: '
                '$deeplink',
          ),
        );

      case AuthErrorCreateEditInvitationState(:final exception):
        context
          ..pop() // loading
          ..pop();
        return context.showAuthException(exception);
      case DataErrorCreateEditInvitationState(:final exception):
        context
          ..pop() // loading
          ..pop();
        return context.showDataException(exception);
    }
  }

  void _onSubmit() {
    final l10n = context.l10n;
    FocusScope.of(context).unfocus();

    if (selectedRole == null) {
      context.showError(title: l10n.pleaseCompleteAllFields);
      return;
    }

    final isEditing = widget.invitation != null;

    if (isEditing) {
      final updatedInvitation = widget.invitation?.copyWith(
        accountType: selectedRole!,
        permissions: selectedPermissions,
      );

      if (updatedInvitation != null) {
        ref.read(createEditInvitationProvider.notifier).edit(updatedInvitation);
      }
    } else {
      final user = ref.read(accountProvider).currentUser;
      final barn = ref.read(accountProvider).currentBarn;

      final req = InvitationRequest(
        barnId: barn?.id ?? '',
        barnName: barn?.name ?? '',
        createdById: user.id,
        accountType: selectedRole!,
        permissions: selectedPermissions,
      );

      ref.read(createEditInvitationProvider.notifier).create(req);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isEditing = widget.invitation != null;

    ref.listen<CreateEditInvitationState>(
      createEditInvitationProvider,
      _stateListener,
    );

    return Padding(
      padding: MediaQuery.of(context).viewInsets + 24.edgeInsetsA,
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Share invitation link',
              style: context.headlineSmall,
            ),
            if (isEditing) GLSpaces.px8 else GLSpaces.px24,
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _FieldLabel(l10n.roleType),
                GLSpaces.px8,
                GLDropdown<AccountType>(
                  items: roles,
                  selectedValue: selectedRole,
                  onChanged: (value) => setState(() {
                    selectedRole = value;
                    selectedPermissions = [];
                  }),
                  itemBuilder: (item) => Text(item.toLabel(l10n)),
                  selectedItemBuilder: (item) => Text(item.toLabel(l10n)),
                  hintLabel: l10n.pleaseSelectARole,
                ),
                if (selectedRole == AccountType.manager ||
                    selectedRole == AccountType.groomer) ...[
                  GLSpaces.px16,
                  _FieldLabel(l10n.rolePermissions),
                  GLSpaces.px8,
                  Column(
                    children: PermissionRole.values
                        .map(
                          (perm) => _PermissionCheckbox(
                            permission: perm,
                            isSelected: selectedPermissions.contains(perm),
                            onChanged: (isChecked) {
                              setState(() {
                                if (isChecked) {
                                  if (!selectedPermissions.contains(perm)) {
                                    selectedPermissions.add(perm);
                                  }
                                } else {
                                  selectedPermissions.remove(perm);
                                }
                              });
                            },
                          ),
                        )
                        .toList(),
                  ),
                ],
                GLSpaces.px24,
                // Info card (blue box) as in the design
                Container(
                  width: double.infinity,
                  padding: 16.edgeInsetsA,
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      DecoratedBox(
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              blurRadius: 3,
                              color: Color(0x0A000000),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: 10.edgeInsetsA,
                          child: Container(
                            width: 20,
                            height: 20,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.blue,
                            ),
                            padding: 4.edgeInsetsA,
                            child: const FittedBox(
                              child: Icon(
                                CupertinoIcons.link,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                      GLSpaces.px12,
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Share this link',
                              style: context.bodyMedium.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            GLSpaces.px4,
                            Text(
                              'Copy the link, paste it into WhatsApp or email, '
                              'then send it to the people who need access. '
                              'This link expires in 24 hours.',
                              style: context.bodySmall.copyWith(
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                GLSpaces.px72,
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: context.pop,
                        style: GLButtonStyles.outlineM,
                        child: Text(l10n.cancel),
                      ),
                    ),
                    GLSpaces.px16,
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: selectedRole == null ? null : _onSubmit,
                        style: GLButtonStyles.primaryM,
                        icon: const Icon(GLIcons.share),
                        label: Text(
                          isEditing ? l10n.updateInvitation : l10n.share,
                        ),
                      ),
                    ),
                  ],
                ),
                GLSpaces.px40,
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: context.bodyLarge,
    );
  }
}

class _PermissionCheckbox extends StatelessWidget {
  const _PermissionCheckbox({
    required this.permission,
    required this.isSelected,
    required this.onChanged,
    super.key,
  });

  final PermissionRole permission;
  final bool isSelected;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        onChanged(!isSelected);
      },
      child: Padding(
        padding: 4.edgeInsetsV,
        child: Row(
          children: [
            Theme(
              data: Theme.of(context).copyWith(
                checkboxTheme: CheckboxThemeData(
                  side: const BorderSide(
                    color: GLColors.neutral700,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              child: Checkbox(
                value: isSelected,
                onChanged: (value) => onChanged(value ?? false),
              ),
            ),
            Expanded(
              child: Text(
                permission.toLabel(context.l10n),
                style: context.bodyMedium.copyWith(fontWeight: FontWeight.w400),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
