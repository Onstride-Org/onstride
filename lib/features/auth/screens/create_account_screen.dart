import 'package:app_ui/app_ui.dart';
import 'package:authentication_client/authentication_client.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';
import 'package:gl_horses/features/auth/screens/phone_input_widget.dart'
    if (dart.library.html) 'package:gl_horses/features/auth/screens/phone_input_widget_web.dart'
    as phone_input;

class CreateAccountScreen extends ConsumerStatefulWidget {
  const CreateAccountScreen({
    super.key,
    required this.request,
  });

  static const path = '/signup';
  static const name = 'signup';
  final CreateAccountRequest? request;

  @override
  ConsumerState<CreateAccountScreen> createState() =>
      _CreateAccountScreenState();
}

class _CreateAccountScreenState extends ConsumerState<CreateAccountScreen> {
  final _formKey = GlobalKey<FormState>();

  final nameController = TextEditingController(
    text: kDebugMode ? 'Test Name' : '',
  );
  final emailController = TextEditingController(
    text: kDebugMode ? 'kevin.melendez+owner1@valere.io' : '',
  );
  final passwordController = TextEditingController(
    text: kDebugMode ? 'Password123@' : '',
  );

  // E.164 (+1..., +52..., etc). This is what you will send to backend.
  final phoneController = TextEditingController();

  // Visible input for intl_phone_number_input
  final phoneTextController = TextEditingController();

  final barnNameController = TextEditingController();
  AccountType? selectedAccountType;
  bool obscurePassword = true;

  late phone_input.PhoneInputState _phoneInputState;
  bool _isPhoneValid = false;

  @override
  void initState() {
    super.initState();
    _phoneInputState = phone_input.PhoneInputState();
    final request = widget.request;
    if (request == null) return;
    nameController.text = request.name;
    emailController.text = request.email;
    passwordController.text = request.password;
    phoneController.text = request.phoneNumber;
    setState(() => selectedAccountType = request.accountType);
    _hydrateInitialPhone(request.phoneNumber);
  }

  Future<void> _hydrateInitialPhone(String phoneE164) async {
    try {
      await _phoneInputState.hydrateFromE164(phoneE164, phoneTextController);
      if (!mounted) return;
      setState(() {
        _isPhoneValid = true;
      });
    } catch (_) {}
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    phoneController.dispose();
    phoneTextController.dispose();
    barnNameController.dispose();
    super.dispose();
  }

  final List<AccountType> roles = [
    AccountType.owner,
    AccountType.boarder,
    AccountType.manager,
    AccountType.groomer,
  ];

  void _stateListener(CreateAccountState? previous, CreateAccountState next) {
    switch (next) {
      case LoadingCreateAccountState():
        return showLoadingDialog(context);
      case SuccessCreateAccountState():
        final accountType = next.user.accountType;
        if (accountType == AccountType.owner) {
          final name = barnNameController.text;
          final id = next.user.id;
          ref
              .read(setBarnNameProvider.notifier)
              .setBarnName(ownerId: id, name: name);
          return;
        }
        ref.read(accountProvider.notifier).loadUser(next.user.id);
        return _onSuccessState();
      case ErrorCreateAccountState(:final exception):
        context.pop();
        context.showAuthException(exception as AuthenticationException);
      case InitialCreateAccountState():
        break;
    }
  }

  void _createBarnListener(SetBarnNameState? previous, SetBarnNameState next) {
    if (next is SuccessSetBarnNameState) {
      ref.read(accountProvider.notifier).setBarn(next.barn);
      _onSuccessState();
    }
    if (next is ErrorSetBarnNameState) {
      _onSuccessState();
      context.showDataException(
        next.exception,
        title: context.l10n.errorOnBarnCreation,
      );
    }
  }

  void _onSuccessState() {
    final l10n = context.l10n;
    context
      ..pop()
      ..showSuccess(title: l10n.accountCreatedCorrectly);
    return context.goNamed(HomeScreen.name);
  }

  void _onSubmit() {
    final l10n = context.l10n;

    if (!_formKey.currentState!.validate() || selectedAccountType == null) {
      context.showError(title: l10n.pleaseCompleteAllFields);
      return;
    }

    final request = CreateAccountRequest(
      name: nameController.text.trim(),
      email: emailController.text.trim(),
      phoneNumber: phoneController.text.trim(),
      password: passwordController.text.trim(),
      accountType: selectedAccountType!,
      barnId: widget.request?.barnId,
      permissions: widget.request?.permissions ?? [],
    );

    ref.read(createAccountProvider.notifier).submit(request: request);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    ref
      ..listen<CreateAccountState>(createAccountProvider, _stateListener)
      ..listen<SetBarnNameState>(setBarnNameProvider, _createBarnListener);

    final request = widget.request;
    final isCreating = request == null || request.barnId == null;
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
              Text(l10n.createAccount, style: context.headlineSmall),
              GLSpaces.px24,
              _FieldLabel(l10n.name),
              GLSpaces.px8,
              TextFormField(
                controller: nameController,
                textCapitalization: TextCapitalization.words,
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
                enabled: isCreating,
                controller: emailController,
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
              phone_input.buildPhoneInput(
                key: const ValueKey('create_account_phone_input'),
                state: _phoneInputState,
                textController: phoneTextController,
                onInputChanged: (String phoneNumber) {
                  phoneController.text = phoneNumber.trim();
                },
                onInputValidated: (bool value) {
                  _isPhoneValid = value;
                },
                validator: (value) {
                  final raw = (value ?? '').trim();
                  if (raw.isEmpty && phoneController.text.trim().isEmpty) {
                    return l10n.phoneIsRequired;
                  }

                  if (phoneController.text.trim().isEmpty || !_isPhoneValid) {
                    return l10n.invalidPhoneNumber;
                  }
                  if (!phoneController.text.trim().startsWith('+')) {
                    return l10n.phoneMustStartWithPlus;
                  }

                  return null;
                },
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
                enabled: isCreating,
                label: Text(l10n.selectRole),
                selectedItemBuilder: (item) => Text(item.toLabel(context.l10n)),
                items: roles,
                onChanged: (newValue) =>
                    setState(() => selectedAccountType = newValue),
                selectedValue: selectedAccountType,
                itemBuilder: (item) => Text(item.toLabel(l10n)),
                hintLabel: l10n.pleaseSelectARole,
              ),
              if (selectedAccountType == AccountType.owner) ...[
                GLSpaces.px16,
                _FieldLabel(l10n.barnName),
                GLSpaces.px8,
                TextFormField(
                  style: context.bodyMedium,

                  controller: barnNameController,
                  decoration: InputDecoration(
                    hintText: context.l10n.enterBarnName,
                  ),
                  textCapitalization: TextCapitalization.sentences,
                  keyboardType: TextInputType.name,
                  validator: (value) => FormValidator.minLength(
                    value,
                    emptyMessage: l10n.barnNameIsRequired,
                    invalidMessage: l10n.invalidBarnName,
                  ),
                ),
              ],
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
                    l10n.signUp,
                    style: context.labelLarge.copyWith(color: Colors.white),
                  ),
                ),
              ),
              GLSpaces.px16,
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(l10n.alreadyHaveAccount, style: context.bodySmall),
                  TextButton(
                    onPressed: context.pop,
                    child: Text(l10n.login, style: context.bodySmall),
                  ),
                ],
              ),
              GLSpaces.px40,
            ],
          ),
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: context.bodyMedium.copyWith(fontWeight: FontWeight.w400),
    );
  }
}
