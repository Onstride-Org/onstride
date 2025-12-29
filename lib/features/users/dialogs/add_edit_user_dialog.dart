import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart'; // asegúrate que aquí esté createEditUserProvider
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:models/models.dart';

class AddEditUserDialog extends ConsumerStatefulWidget {
  const AddEditUserDialog({super.key, this.user});

  final GLUser? user;

  static Future<GLUser?> show(BuildContext context, {GLUser? user}) {
    return showModalBottomSheet<GLUser?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.backgroundColor,
      builder: (_) => AddEditUserDialog(user: user),
    );
  }

  @override
  ConsumerState<AddEditUserDialog> createState() => _AddUserDialogState();
}

class _AddUserDialogState extends ConsumerState<AddEditUserDialog> {
  final _formKey = GlobalKey<FormState>();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();
  final passwordController = TextEditingController();
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
    final user = widget.user;
    selectedRole = user?.accountType;
    selectedPermissions = List.of(user?.permissions ?? const []);
    if (user != null) {
      emailController.text = user.email ?? '';
      phoneController.text = user.phoneNumber ?? '';
    }
  }

  void _stateListener(CreateEditUserState? previous, CreateEditUserState next) {
    final isEditing = widget.user != null;
    switch (next) {
      case InitialCreateEditUserState():
        return;
      case LoadingCreateEditUserState():
        showInvisibleLoadingDialog(context);
        return;
      case SuccessCreateEditUserState():
        context
          ..pop()
          ..pop(next.user);
        return context.showSuccess(
          title: isEditing
              ? context.l10n.accountUpdatedCorrectly
              : context.l10n.accountCreatedCorrectly,
        );
      case AuthErrorCreateEditUserState(:final exception):
        context
          ..pop()
          ..pop();
        return context.showAuthException(exception);
      case DataErrorCreateEditUserState(:final exception):
        context
          ..pop()
          ..pop();
        return context.showDataException(exception);
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    phoneController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  void _onSubmit() {
    final l10n = context.l10n;
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate() || selectedRole == null) {
      context.showError(title: l10n.pleaseCompleteAllFields);
      return;
    }

    final isEditing = widget.user != null;

    if (isEditing) {
      final req = EditUserRequest(
        accountType: selectedRole!,
        permissions: selectedPermissions,
      );
      ref.read(createEditUserProvider.notifier).edit(widget.user!, req);
    } else {
      final user = ref.read(accountProvider).currentUser;
      final barn = ref.read(accountProvider).currentBarn;
      final req = CreateAccountRequest(
        name: '',
        barnId: barn?.id,
        email: emailController.text.trim(),
        phoneNumber: phoneController.text.trim(),
        password: 'Password123@',
        accountType: selectedRole!,
        permissions: selectedPermissions,
      );
      ref.read(createEditUserProvider.notifier).create(user.id, req);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isEditing = widget.user != null;

    ref.listen<CreateEditUserState>(createEditUserProvider, _stateListener);

    return Padding(
      padding: MediaQuery.of(context).viewInsets + 24.edgeInsetsA,
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isEditing ? l10n.editUser : l10n.addUser,
              style: context.headlineSmall,
            ),

            if (isEditing) GLSpaces.px8 else GLSpaces.px24,
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (isEditing) ...[
                    Text(
                      widget.user?.name ?? '',
                      style: context.labelMedium.copyWith(
                        color: context.hintColor,
                      ),
                    ),
                    Text(
                      widget.user?.email ?? '',
                      style: context.labelMedium.copyWith(
                        color: context.hintColor,
                      ),
                    ),
                    GLSpaces.px16,
                  ],
                  if (!isEditing) ...[
                    _FieldLabel(l10n.email),
                    GLSpaces.px8,
                    TextFormField(
                      controller: emailController,
                      decoration: InputDecoration(
                        hintText: l10n.exampleEmail,
                      ),
                      validator: (value) => FormValidator.email(
                        value,
                        emptyMessage: l10n.emailIsRequired,
                        invalidMessage: l10n.invalidEmailFormat,
                      ),
                    ),
                    GLSpaces.px16,
                    _FieldLabel(l10n.phoneNumber),
                    GLSpaces.px8,
                    TextFormField(
                      controller: phoneController,
                      decoration: const InputDecoration(
                        hintText: phoneHintText,
                      ),
                      inputFormatters: [
                        MaskTextInputFormatter(mask: maskPhoneText),
                      ],
                      keyboardType: TextInputType.phone,
                      validator: (value) => FormValidator.phone(
                        value,
                        emptyMessage: l10n.phoneIsRequired,
                        invalidMessage: l10n.invalidPhoneNumber,
                        startsWithDialCodeMessage: l10n.phoneMustStartWithPlus,
                      ),
                    ),
                    GLSpaces.px16,
                    // _FieldLabel(l10n.password),
                    // GLSpaces.px8,
                    // TextFormField(
                    //   controller: passwordController,
                    //   decoration: const InputDecoration(
                    //     hintText: 'Password@123',
                    //   ),
                    //   // On edit: password is optional; if provided, validate strength.
                    //   validator: (value) {
                    //     if (isEditing) {
                    //       if ((value ?? '').trim().isEmpty) return null;
                    //       return FormValidator.passwordSecurity(
                    //         value,
                    //         emptyMessage: l10n.passwordIsRequired,
                    //         invalidMessage: l10n.passwordIsTooWeak,
                    //       );
                    //     }
                    //     return FormValidator.passwordSecurity(
                    //       value,
                    //       emptyMessage: l10n.passwordIsRequired,
                    //       invalidMessage: l10n.passwordIsTooWeak,
                    //     );
                    //   },
                    // ),
                    // GLSpaces.px8,
                    // AnimatedBuilder(
                    //   animation: passwordController,
                    //   builder: (_, child) => PasswordRequirementsIndicator(
                    //     password: passwordController.text,
                    //   ),
                    // ),
                    // GLSpaces.px16,
                  ],
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
                    GLDropdown<PermissionRole>(
                      items: PermissionRole.values,
                      onChanged: (value) {
                        if (!selectedPermissions.contains(value)) {
                          setState(() => selectedPermissions.add(value));
                        }
                      },
                      selectedValue: selectedPermissions.isNotEmpty
                          ? selectedPermissions.first
                          : null,
                      itemBuilder: (item) => Text(item.toLabel(context.l10n)),
                      hintLabel: l10n.selectRolePermissions,
                      selectedItemBuilder: (_) => Text(
                        selectedPermissions
                            .map((e) => e.toLabel(context.l10n))
                            .join(', '),
                      ),
                    ),
                    GLSpaces.px4,
                    Wrap(
                      spacing: 4.sp,
                      children: selectedPermissions
                          .map(
                            (perm) => Chip(
                              labelStyle: context.labelSmall,
                              label: Text(perm.toLabel(context.l10n)),
                              side: BorderSide.none,
                              padding: 0.edgeInsetsA,
                              backgroundColor: GLColors.brandSwatch.shade50,
                              deleteIconColor: GLColors.brandSwatch.shade900,
                              deleteIcon: Icon(GLIcons.x, size: 12.sp),
                              onDeleted: () => setState(() {
                                selectedPermissions.remove(perm);
                              }),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                  GLSpaces.px24,
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
                        child: ElevatedButton(
                          onPressed: selectedRole == null ? null : _onSubmit,
                          style: GLButtonStyles.primaryM,
                          child: Text(isEditing ? l10n.update : l10n.save),
                        ),
                      ),
                    ],
                  ),
                  GLSpaces.px40,
                ],
              ),
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
      style: context.bodyMedium.copyWith(fontWeight: FontWeight.w400),
    );
  }
}
