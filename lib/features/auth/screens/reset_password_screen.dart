import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/auth/providers/send_reset_password/send_reset_password_provider.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({
    required this.email,
    super.key,
  });

  static const path = '/reset-password';
  static const name = 'reset-password';

  final String email;

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  late final TextEditingController emailController;

  @override
  void initState() {
    emailController = TextEditingController(text: widget.email);
    super.initState();
  }

  @override
  void dispose() {
    emailController.dispose();
    super.dispose();
  }

  void _stateListener(ResetPasswordState? previous, ResetPasswordState next) {
    switch (next) {
      case InitialResetPasswordState():
        return;
      case LoadingResetPasswordState():
        return showInvisibleLoadingDialog(context);
      case SuccessResetPasswordState():
        context.showSuccess(
          seconds: 10,
          title: context.l10n.mailSentTitle,
          subtitle: context.l10n.mailSentSubtitle,
        );
        context.pop();
        context.pop();
        return;
      case ErrorResetPasswordState(:final exception):
        context.showAuthException(exception);
        context.pop();
        return;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    ref.listen(resetPasswordProvider, _stateListener);
    final isLoading =
        ref.watch(resetPasswordProvider) is LoadingResetPasswordState;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.resetPassword, style: context.titleLarge),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const BackButton(),
      ),
      body: SingleChildScrollView(
        padding: 24.edgeInsetsH,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GLSpaces.px32,
            Text(l10n.email, style: context.bodySmall),
            GLSpaces.px8,
            TextFormField(
              controller: emailController,
              validator: (value) => FormValidator.email(
                value,
                emptyMessage: l10n.requiredField,
                invalidMessage: l10n.invalidEmailDesc,
              ),
              decoration: InputDecoration(hintText: l10n.emailHint),
              keyboardType: TextInputType.emailAddress,
            ),
            GLSpaces.px32,
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final validation = FormValidator.email(
                    emailController.text.trim(),
                    emptyMessage: l10n.requiredField,
                    invalidMessage: l10n.invalidEmailDesc,
                  );

                  if (validation != null) {
                    context.showError(title: l10n.invalidEmailTitle);
                    return;
                  }

                  ref
                      .read(resetPasswordProvider.notifier)
                      .sendResetEmail(emailController.text.trim());
                },
                style: GLButtonStyles.primaryL,
                child: isLoading
                    ? const GLBouncingDotsIndicator(
                        color: Colors.white,
                        size: 6,
                      )
                    : Text(
                        l10n.sendResetEmail,
                        style: context.labelLarge.copyWith(color: Colors.white),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
