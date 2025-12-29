import 'package:app_ui/app_ui.dart';
import 'package:auth_repository/auth_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/auth/auth.dart';
import 'package:gl_horses/features/home/screens/home_screen.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  static const path = '/login';
  static const name = 'login';

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

  final emailController = TextEditingController(
    // text: kDebugMode ? 'donald+owner@valere.io' : '',
  );
  final passwordController = TextEditingController(
    // text: kDebugMode ? 'Password123@' : '',
  );

  bool obscurePassword = true;

  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => ref.read(loadCredentialsProvider.notifier).readCredentials(),
    );
    super.initState();
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  void _stateListener(LoginState? previous, LoginState next) {
    switch (next) {
      case LoadingLoginState():
        return showLoadingDialog(context);
      case ErrorLoginState(:final exception):
        context.pop();
        if (exception is UserNeedCompleteTheirAccountException) {
          final request = CreateAccountRequest.fromJson(exception.userData);
          context.pushNamed(CreateAccountScreen.name, extra: request);
          return;
        }
        ref.read(authRepositoryProvider).logOut();
        return context.showAuthException(exception);
      default:
        return;
    }
  }

  void _accountListener(AccountState? previous, AccountState next) {
    final l10n = context.l10n;
    final state = ref.read(loginProvider);

    if (state is SuccessLoginState) {
      switch (next) {
        case SuccessAccountState():
          final user = next.user;
          final name = user.name;

          if (user.deletedAt != null) {
            context
              ..pop()
              ..showError(
                title: l10n.userDeletedTitle,
                subtitle: l10n.userDeletedSubtitle,
                showClose: false,
                action: AppSnackBarAction(
                  label: l10n.yes,
                  action: () {
                    ref.read(authRepositoryProvider).deleteUser();
                    context.pushNamed(
                      CreateAccountScreen.name,
                      extra: CreateAccountRequest(
                        name: user.name ?? '',
                        email: user.email ?? '',
                        phoneNumber: user.phoneNumber ?? '',
                        accountType: user.accountType!,
                        barnId: null,
                        password: '',
                      ),
                    );
                  },
                ),
              );
            return;
          }
          ref.read(pushNotificationsServiceProvider).saveFCMCurrentToken();
          if (name == null || name.isEmpty) {
            context.goNamed(CompleteAccountScreen.name, extra: user);
          } else {
            context.goNamed(HomeScreen.name);
          }
          ref
              .read(loadCredentialsProvider.notifier)
              .saveCredentials(
                email: emailController.text,
                password: passwordController.text,
              );
        case ErrorAccountState():
          ref.read(authRepositoryProvider).logOut();
          context.pop();
          return context.showDataException(next.exception);
        default:
          return;
      }
    }
  }

  void _loadCredentialsListener(
    LoadCredentialsState? previous,
    LoadCredentialsState next,
  ) {
    if (next is SuccessLoadCredentialsState &&
        emailController.text.isEmpty &&
        passwordController.text.isEmpty) {
      emailController.text = next.credentials?.email ?? '';
      passwordController.text = next.credentials?.password ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    ref
      ..listen(loginProvider, _stateListener)
      ..listen(loadCredentialsProvider, _loadCredentialsListener)
      ..listen(accountProvider, _accountListener);

    final rememberMe = ref.watch(loadCredentialsProvider).rememberMe;

    return Stack(
      fit: StackFit.expand,
      children: [
        const ColoredBox(color: Colors.white),
        Positioned.fill(
          bottom: .3.sh,
          child: Assets.images.loginBg.image(fit: BoxFit.cover),
        ),
        Scaffold(
          backgroundColor: Colors.transparent,
          appBar: AppBar(
            elevation: 0,
            backgroundColor: Colors.transparent,
            centerTitle: false,
            title: Assets.images.textLogo.image(height: 20.h),
          ),
          body: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: .23.sh),
                Padding(
                  padding: 20.edgeInsetsH,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.hello,
                        style: context.displaySmall.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      GLSpaces.px4,
                      Text(
                        l10n.loginSubtitle,
                        style: context.headlineSmall.copyWith(
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
                GLSpaces.px32,
                Container(
                  padding: 24.edgeInsetsA,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: 20.borderRadiusT,
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(l10n.email, style: context.bodySmall),
                        GLSpaces.px8,
                        TextFormField(
                          controller: emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(hintText: l10n.emailHint),
                          validator: (value) => FormValidator.email(
                            value,
                            emptyMessage: l10n.emailIsRequired,
                            invalidMessage: l10n.invalidEmailDesc,
                          ),
                        ),
                        GLSpaces.px16,
                        Text(l10n.password, style: context.bodySmall),
                        GLSpaces.px8,
                        TextFormField(
                          controller: passwordController,
                          obscureText: obscurePassword,
                          decoration: InputDecoration(
                            hintText: l10n.passwordHint,
                            suffixIcon: IconButton(
                              icon: Icon(
                                obscurePassword
                                    ? Icons.visibility_off
                                    : Icons.visibility,
                              ),
                              onPressed: () {
                                setState(() {
                                  obscurePassword = !obscurePassword;
                                });
                              },
                            ),
                          ),
                          validator: (value) => FormValidator.noEmpty(
                            value,
                            emptyMessage: l10n.passwordIsRequired,
                          ),
                        ),
                        GLSpaces.px8,
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(
                              child: CheckboxListTile(
                                value: rememberMe,
                                onChanged: (_) {
                                  ref
                                      .read(loadCredentialsProvider.notifier)
                                      .switchRememberMe();
                                },
                                title: Text(
                                  l10n.rememberMe,
                                  style: context.bodySmall,
                                ),
                                controlAffinity:
                                    ListTileControlAffinity.leading,
                                contentPadding: EdgeInsets.zero,
                                dense: true,
                              ),
                            ),
                            TextButton(
                              onPressed: () => context.pushNamed(
                                ResetPasswordScreen.name,
                                queryParameters: {
                                  'email': emailController.text,
                                },
                              ),
                              child: Text(
                                l10n.forgotPassword,
                                style: context.bodySmall,
                              ),
                            ),
                          ],
                        ),
                        GLSpaces.px16,
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: GLButtonStyles.primaryL,
                            onPressed: () {
                              if (_formKey.currentState?.validate() ?? false) {
                                ref
                                    .read(loginProvider.notifier)
                                    .login(
                                      email: emailController.text.trim(),
                                      password: passwordController.text.trim(),
                                    );
                              }
                            },
                            child: Text(
                              l10n.login,
                              style: context.labelLarge.copyWith(
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                        GLSpaces.px16,
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              l10n.dontHaveAnAccount,
                              style: context.bodySmall,
                            ),
                            TextButton(
                              onPressed: () =>
                                  context.pushNamed(CreateAccountScreen.name),
                              child: Text(
                                l10n.signUp,
                                style: context.bodySmall,
                              ),
                            ),
                          ],
                        ),
                        GLSpaces.px72,
                      ],
                    ),
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
