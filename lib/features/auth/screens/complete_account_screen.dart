import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:models/models.dart';

class CompleteAccountScreen extends ConsumerStatefulWidget {
  const CompleteAccountScreen({
    required this.user,
    super.key,
  });

  static const path = '/complete-account';
  static const name = 'complete-account';

  final GLUser user;

  @override
  ConsumerState<CompleteAccountScreen> createState() =>
      _CompleteAccountScreenState();
}

class _CompleteAccountScreenState extends ConsumerState<CompleteAccountScreen> {
  final _formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final phoneController = TextEditingController();
  AccountType? selectedRole;
  bool obscurePassword = true;
  final List<AccountType> roles = [
    AccountType.owner,
    AccountType.boarder,
    AccountType.manager,
    AccountType.groomer,
  ];

  @override
  void initState() {
    final user = widget.user;
    nameController.text = user.name ?? '';
    emailController.text = user.email ?? '';
    phoneController.text = user.phoneNumber ?? '';
    setState(() => selectedRole = user.accountType);
    super.initState();
  }

  void _stateListener(
    CompleteAccountState? previous,
    CompleteAccountState next,
  ) {
    final l10n = context.l10n;
    switch (next) {
      case LoadingCompleteAccountState():
        return showLoadingDialog(context);
      case SuccessCompleteAccountState():
        context.pop();
        context.showSuccess(title: 'Account completed successfully');
        return context.goNamed(HomeScreen.name);
      case ErrorCompleteAccountState(:final exception):
        context.pop();
        context.showDataException(exception);
      case InitialCompleteAccountState():
        break;
    }
  }

  void _onSubmit() {
    final l10n = context.l10n;

    if (!_formKey.currentState!.validate() || selectedRole == null) {
      context.showError(title: l10n.pleaseCompleteAllFields);
      return;
    }
    final user = widget.user.copyWith(
      name: nameController.text,
    );
    ref
        .read(completeAccountProvider.notifier)
        .submit(
          user: user,
          password: passwordController.text,
        );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    ref.listen<CompleteAccountState>(completeAccountProvider, _stateListener);
    final email = widget.user.email;
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        title: Assets.images.textLogo.image(
          height: 20.h,
          color: context.primaryColorDark,
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: 24.edgeInsetsH,
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GLSpaces.px24,
              Text('Complete Account', style: context.headlineSmall),
              GLSpaces.px24,
              _FieldLabel(l10n.name),
              GLSpaces.px8,
              TextFormField(
                controller: nameController,
                decoration: InputDecoration(hintText: l10n.nameHint),
                validator: (value) => FormValidator.noEmpty(
                  value,
                  emptyMessage: l10n.nameIsRequired,
                ),
              ),
              GLSpaces.px16,
              _FieldLabel(l10n.email),
              GLSpaces.px8,
              TextFormField(
                controller: emailController,
                enabled: email == null || email.isEmpty,
                decoration: InputDecoration(hintText: l10n.exampleEmail),
                keyboardType: TextInputType.emailAddress,
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
                style: context.bodyMedium,
                enabled: true,
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
              _FieldLabel(l10n.password),
              GLSpaces.px8,
              TextFormField(
                controller: passwordController,
                obscureText: obscurePassword,
                decoration: InputDecoration(
                  hintText: '*****',
                  suffixIcon: IconButton(
                    icon: Icon(
                      obscurePassword ? Icons.visibility_off : Icons.visibility,
                    ),
                    onPressed: () =>
                        setState(() => obscurePassword = !obscurePassword),
                  ),
                ),
                validator: (value) => FormValidator.passwordSecurity(
                  value,
                  emptyMessage: l10n.passwordIsRequired,
                  invalidMessage: l10n.passwordIsTooWeak,
                ),
              ),
              GLSpaces.px8,
              AnimatedBuilder(
                animation: passwordController,
                builder: (_, child) => PasswordRequirementsIndicator(
                  password: passwordController.text,
                ),
              ),
              GLSpaces.px16,
              GLDropdown<AccountType>(
                enabled: false,
                label: Text(l10n.selectRole),
                selectedItemBuilder: (item) => Text(item.toLabel(context.l10n)),
                items: roles,
                onChanged: (newValue) =>
                    setState(() => selectedRole = newValue),
                selectedValue: selectedRole,
                itemBuilder: (item) => Text(item.toLabel(l10n)),
                hintLabel: l10n.pleaseSelectARole,
              ),
              GLSpaces.px32,
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _onSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.primaryColor,
                    padding: EdgeInsets.symmetric(vertical: 14.h),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8.r),
                    ),
                  ),
                  child: Text(
                    'Save',
                    style: context.labelLarge.copyWith(color: Colors.white),
                  ),
                ),
              ),
              GLSpaces.px16,
            ],
          ),
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
