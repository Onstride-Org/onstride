import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/auth/screens/screens.dart';
import 'package:gl_horses/features/profile/profile.dart';
import 'package:gl_horses/features/profile/providers/delete_account_prevention_reason.dart';
import 'package:gl_horses/features/profile/widgets/confirm_password_dialog.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:models/models.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  static const String path = '/profile';
  static const String name = 'profile';

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late GLUser user;
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _roleController;
  bool _isEditing = false;
  bool _isLoading = false;

  late String _originalName;
  late String _originalPhone;

  @override
  void initState() {
    super.initState();
    user = ref.read(accountProvider).currentUser;
    _originalName = user.name ?? '';
    _originalPhone = user.phoneNumber ?? '';

    _nameController = TextEditingController(text: _originalName);
    _emailController = TextEditingController(text: user.email ?? '');
    _phoneController = TextEditingController(text: _originalPhone);
    _roleController = TextEditingController(
      text: user.accountType?.name.toCapitalized() ?? '',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _roleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _listenDeleteAccountState(context);
    _listenUpdateProfileState(context);

    return Scaffold(
      appBar: _ProfileAppBar(),
      body: Column(
        children: [
          SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GLSpaces.px24,
                Consumer(
                  builder: (context, ref, child) {
                    final currentUser = ref.watch(accountProvider).currentUser;
                    return _AvatarInitials(currentUser);
                  },
                ),
                GLSpaces.px32,
                _CustomTextField(
                  label: context.l10n.name,
                  controller: _nameController,
                  enabled: _isEditing,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z\s]')),
                  ],
                  textCapitalization: TextCapitalization.words,
                  validator: (value) => FormValidator.noEmpty(
                    value,
                    emptyMessage: context.l10n.nameIsRequired,
                  ),
                ),
                GLSpaces.px20,
                _CustomTextField(
                  label: context.l10n.email,
                  controller: _emailController,
                  enabled: false,
                ),
                GLSpaces.px20,
                _CustomTextField(
                  label: context.l10n.phoneNumber,
                  controller: _phoneController,
                  enabled: _isEditing,
                  hintText: phoneHintText,
                  inputFormatters: [
                    MaskTextInputFormatter(mask: maskPhoneText),
                  ],
                  keyboardType: TextInputType.phone,
                  validator: (value) => FormValidator.phone(
                    value,
                    emptyMessage: context.l10n.phoneIsRequired,
                    invalidMessage: context.l10n.invalidPhoneNumber,
                    startsWithDialCodeMessage:
                        context.l10n.phoneMustStartWithPlus,
                  ),
                ),
                GLSpaces.px20,
                _CustomTextField(
                  label: context.l10n.role,
                  controller: _roleController,
                  enabled: false,
                ),
                GLSpaces.px48,
                if (!_isEditing)
                  _EditButton(
                    context.l10n.editInformation,
                    () => setState(() => _isEditing = true),
                  )
                else
                  _EditModeButtons(
                    onCancel: () {
                      _restoreOriginalValues();
                      setState(() => _isEditing = false);
                    },
                    onSave: _saveChanges,
                    onDeleteAccount: () =>
                        _showDeleteAccountConfirmation(context),
                    isLoading: _isLoading,
                  ),
                GLSpaces.px32,
              ],
            ),
          ),
          const Spacer(),
          _AppVersionWidget(),
        ],
      ),
    );
  }

  void _listenDeleteAccountState(BuildContext context) {
    ref.listen<DeleteAccountState>(
      deleteAccountProvider,
      (previous, next) {
        if (next is SuccessDeleteAccountState) {
          Navigator.of(context).pop();
          context.showSuccess(
            title: context.l10n.deleteAccountSuccess,
          );

          if (context.mounted) {
            context.goNamed(LoginScreen.name);
          }
        } else if (next is ErrorDeleteAccountState) {
          context.showError(
            title: context.l10n.deleteAccountFailedTitle,
            subtitle: context.l10n.deleteAccountFailedDesc,
          );
        } else if (next is AuthenticationErrorDeleteAccountState) {
          context.showError(
            title: context.l10n.authenticationFailedTitle,
            subtitle: context.l10n.authenticationFailedMessage,
          );
        } else if (next is PreventedDeleteAccountState) {
          context.showError(
            title: _getPreventionTitle(next.reason),
            subtitle: _getPreventionMessage(next.reason),
          );
        }
      },
    );
  }

  String _getPreventionTitle(DeleteAccountPreventionReason reason) {
    switch (reason) {
      case DeleteAccountPreventionReason.ownerAccount:
        return context.l10n.accountDeletionNotAvailable;
      case DeleteAccountPreventionReason.outstandingInvoices:
        return context.l10n.outstandingInvoices;
      case DeleteAccountPreventionReason.assignedTasks:
        return context.l10n.cannotDeleteAccount;
      case DeleteAccountPreventionReason.authenticationFailed:
        return context.l10n.authenticationFailedTitle;
      case DeleteAccountPreventionReason.dataValidationFailed:
        return context.l10n.dataValidationFailedTitle;
      case DeleteAccountPreventionReason.unknownError:
        return context.l10n.unknownErrorTitle;
    }
  }

  String _getPreventionMessage(DeleteAccountPreventionReason reason) {
    switch (reason) {
      case DeleteAccountPreventionReason.ownerAccount:
        return context.l10n.ownerAccountDeletionMessage;
      case DeleteAccountPreventionReason.outstandingInvoices:
        return context.l10n.outstandingInvoicesPrevention;
      case DeleteAccountPreventionReason.assignedTasks:
        return context.l10n.assignedTasksPrevention;
      case DeleteAccountPreventionReason.authenticationFailed:
        return context.l10n.authenticationFailedMessage;
      case DeleteAccountPreventionReason.dataValidationFailed:
        return context.l10n.dataValidationFailedMessage;
      case DeleteAccountPreventionReason.unknownError:
        return context.l10n.unknownErrorMessage;
    }
  }

  Future<void> _showDeleteAccountConfirmation(BuildContext context) async {
    await ConfirmPasswordDialog.show(
      context,
      title: context.l10n.deleteAccountWithPasswordTitle,
      description: context.l10n.deleteAccountWithPasswordDescription,
      confirmText: context.l10n.deleteAccount,
      confirmButtonColor: Colors.red,
      onConfirm: (password) async {
        try {
          await ref
              .read(deleteAccountProvider.notifier)
              .deleteAccount(
                reason: 'User requested account deletion',
                registrationMethod: user.registrationMethod?.name ?? 'email',
                password: password,
              );
          return true;
        } on Exception {
          return false;
        }
      },
    );
  }

  void _listenUpdateProfileState(BuildContext context) {
    ref.listen<UpdateProfileState>(
      updateProfileProvider,
      (previous, next) {
        if (next is SuccessUpdateProfileState) {
          setState(() => _isEditing = false);
          context.showSuccess(
            title: context.l10n.accountUpdatedCorrectly,
          );
        } else if (next is ErrorUpdateProfileState) {
          context.showError(
            title: context.l10n.updateFailedTitle,
            subtitle: context.l10n.updateFailedDesc,
          );
        }
      },
    );
  }

  void _restoreOriginalValues() {
    _nameController.text = _originalName;
    _phoneController.text = _originalPhone;
  }

  Future<void> _saveChanges() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();

    if (name == _originalName && phone == _originalPhone) {
      // No changes detected, switch back to read-only mode
      setState(() => _isEditing = false);
      return;
    }

    if (name.isEmpty) {
      context.showError(title: context.l10n.nameIsRequired);
      return;
    }

    if (phone.isEmpty) {
      context.showError(title: context.l10n.phoneIsRequired);
      return;
    }

    if (!FormValidator.isValidPhone(phone)) {
      context.showError(title: context.l10n.invalidPhoneNumber);
      return;
    }

    setState(() => _isLoading = true);

    try {
      await ref
          .read(updateProfileProvider.notifier)
          .updateProfile(
            name: name,
            phoneNumber: phone,
          );
    } finally {
      if (mounted) {
        _originalName = _nameController.text;
        _originalPhone = _phoneController.text;
        setState(() => _isLoading = false);
      }
    }
  }
}

class _ProfileAppBar extends StatelessWidget implements PreferredSizeWidget {
  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.chevron_left, color: Colors.black),
        onPressed: () => Navigator.pop(context),
      ),
      title: Text(
        context.l10n.profile,
        style: const TextStyle(
          color: Colors.black,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      centerTitle: true,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _AvatarInitials extends StatelessWidget {
  const _AvatarInitials(this.user);

  final GLUser user;

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      backgroundColor: GLColors.brand800,
      child: Text(
        user.initials,
        style: context.bodyMedium.copyWith(
          color: Colors.white,
        ),
      ),
    );
  }
}

class _CustomTextField extends StatelessWidget {
  const _CustomTextField({
    required this.label,
    required this.controller,
    required this.enabled,
    this.inputFormatters,
    this.keyboardType,
    this.hintText,
    this.validator,
    this.textCapitalization,
  });

  final String label;
  final TextEditingController controller;
  final bool enabled;
  final List<TextInputFormatter>? inputFormatters;
  final TextInputType? keyboardType;
  final String? hintText;
  final String? Function(String?)? validator;
  final TextCapitalization? textCapitalization;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: enabled ? const Color(0xFF12251B) : const Color(0xFFA9B7C4),
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        GLSpaces.px8,
        TextFormField(
          style: context.bodyMedium,
          controller: controller,
          enabled: enabled,
          decoration: hintText != null
              ? InputDecoration(
                  hintText: hintText,
                )
              : null,
          inputFormatters: inputFormatters,
          keyboardType: keyboardType,
          validator: validator,
          textCapitalization: textCapitalization ?? TextCapitalization.none,
        ),
      ],
    );
  }
}

class _EditButton extends StatelessWidget {
  const _EditButton(this.text, this.onPressed);

  final String text;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: GLButtonStyles.outlineM,
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFF12251B),
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _EditModeButtons extends StatelessWidget {
  const _EditModeButtons({
    required this.onCancel,
    required this.onSave,
    required this.onDeleteAccount,
    required this.isLoading,
  });

  final VoidCallback onCancel;
  final VoidCallback onSave;
  final VoidCallback onDeleteAccount;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        SizedBox(
          width: isLoading ? 125 : null,
          child: OutlinedButton(
            onPressed: isLoading ? null : onSave,
            style: GLButtonStyles.outlineM,
            child: isLoading
                ? SizedBox(
                    width: 16.w,
                    height: 16.h,
                    child: const CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Color(0xFF12251B),
                      ),
                    ),
                  )
                : Text(
                    context.l10n.saveChanges,
                    style: const TextStyle(
                      color: Color(0xFF12251B),
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ),
        GLSpaces.px16,
        OutlinedButton(
          onPressed: isLoading ? null : onCancel,
          style: GLButtonStyles.outlineM.copyWith(
            side: WidgetStateProperty.all(const BorderSide(color: Colors.red)),
          ),
          child: Text(
            context.l10n.cancel,
            style: const TextStyle(
              color: Colors.red,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        GLSpaces.px16,
        ElevatedButton(
          onPressed: isLoading ? null : onDeleteAccount,
          style: GLButtonStyles.errorM,
          child: Text(
            context.l10n.deleteAccount,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

class _AppVersionWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flavor = ref.read(flavorConfigProvider);
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 24.w).copyWith(bottom: 24.h),
      child: Text(
        '${flavor.version}+${flavor.buildNumber}',
        style: context.bodySmall.copyWith(
          color: GLColors.neutral600,
          fontSize: 12,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}

extension StringExtension on String {
  String toCapitalized() {
    if (isEmpty) return this;
    return this[0].toUpperCase() + substring(1).toLowerCase();
  }
}
