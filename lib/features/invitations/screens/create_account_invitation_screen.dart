import 'package:app_ui/app_ui.dart';
import 'package:authentication_client/authentication_client.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/invitations/invitations.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:models/models.dart';

class CreateAccountInvitationScreen extends ConsumerStatefulWidget {
  const CreateAccountInvitationScreen({
    required this.invitationId,
    super.key,
  });

  static const path = '/signup-invitation';
  static const name = 'signup-invitation';
  final String invitationId;

  @override
  ConsumerState<CreateAccountInvitationScreen> createState() =>
      _CreateAccountScreenState();
}

class _CreateAccountScreenState
    extends ConsumerState<CreateAccountInvitationScreen> {
  final _formKey = GlobalKey<FormState>();

  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final phoneController = TextEditingController();
  final barnNameController = TextEditingController();
  bool obscurePassword = true;
  Invitation? invitation;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) {
        ref.read(getInvitationProvider.notifier).getById(widget.invitationId);
      },
    );
  }

  void _stateListener(
    CreateAccountState? previous,
    CreateAccountState next,
  ) async {
    switch (next) {
      case LoadingCreateAccountState():
        return showLoadingDialog(context);
      case SuccessCreateAccountState():
        final accountType = next.user.accountType;
        if (accountType == AccountType.owner) {
          final name = barnNameController.text;
          final id = next.user.id;
          await ref
              .read(setBarnNameProvider.notifier)
              .setBarnName(ownerId: id, name: name);
          return;
        }
        await ref.read(accountProvider.notifier).loadUser(next.user.id);
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

  void _invitationStateListener(
    GetInvitationState? previous,
    GetInvitationState next,
  ) {
    final isAuth = ref.read(appStateProvider) is AuthenticatedAppState;
    switch (next) {
      case LoadingGetInvitationState():
        showLoadingDialog(context);
      case SuccessGetInvitationState(:final invitation):
        context.pop();
        final now = DateTime.now();
        final isExpired = invitation.expiresAt.isBefore(now);
        final isInactive = !invitation.active;
        if (isExpired || isInactive) {
          context
            ..showError(
              title: 'This invitation link has expired.',
              subtitle: 'Please request a new one from your barn owner',
            )
            ..goNamed(isAuth ? HomeScreen.name : LoginScreen.name);
          return;
        }
        setState(() => this.invitation = invitation);
      case NotFoundGetInvitationState():
        context.pop();
        context.showError(
          title: 'Invitation not found.',
          subtitle: 'Please request a new one from your barn owner',
        );
        context.goNamed(isAuth ? HomeScreen.name : LoginScreen.name);
      case AuthErrorGetInvitationState(:final exception):
        context.pop();
        context.showAuthException(exception);
        context.goNamed(LoginScreen.name);

      case DataErrorGetInvitationState(:final exception):
        context.pop();
        context.showDataException(exception);
        context.goNamed(LoginScreen.name);

      case InitialGetInvitationState():
        break;
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

    if (invitation == null) {
      context.showError(title: l10n.invitationInvalid);
      return;
    }

    if (!_formKey.currentState!.validate()) {
      context.showError(title: l10n.pleaseCompleteAllFields);
      return;
    }

    final request = CreateAccountRequest(
      name: nameController.text.trim(),
      email: emailController.text.trim(),
      phoneNumber: phoneController.text.trim(),
      password: passwordController.text.trim(),
      accountType: invitation!.accountType,
      barnId: invitation!.barnId,
      permissions: invitation!.permissions,
    );

    ref.read(createAccountProvider.notifier).submit(request: request);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    ref
      ..listen<CreateAccountState>(createAccountProvider, _stateListener)
      ..listen<SetBarnNameState>(setBarnNameProvider, _createBarnListener)
      ..listen<GetInvitationState>(
        getInvitationProvider,
        _invitationStateListener,
      );

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
              Text(
                'Welcome to ${invitation?.barnName}',
                style: context.headlineSmall,
              ),
              Text(
                'Joining as a ${invitation?.accountType.toLabel(l10n)}',
                style: context.titleSmall,
              ),
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
              TextFormField(
                style: context.bodyMedium,
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
              GLSpaces.px32,
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: invitation == null ? null : _onSubmit,
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
