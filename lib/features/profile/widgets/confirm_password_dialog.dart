import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/common/dialogs/otso_base_dialog.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';

class ConfirmPasswordDialog extends ConsumerStatefulWidget {
  const ConfirmPasswordDialog._({
    required this.title,
    required this.onConfirm,
    this.description,
    this.caption,
    this.confirmText,
    this.cancelText,
    this.confirmButtonColor,
  });

  final String title;
  final String? description;
  final String? confirmText;
  final Color? confirmButtonColor;
  final String? cancelText;
  final Widget? caption;
  final Future<bool> Function(String password) onConfirm;

  static Future<bool?> show(
    BuildContext context, {
    required String title,
    required Future<bool> Function(String password) onConfirm,
    String? description,
    Widget? caption,
    String? confirmText,
    Color? confirmButtonColor,
    String? cancelText,
  }) async {
    return showDialog<bool?>(
      context: context,
      barrierColor: Colors.black12,
      builder: (context) => ConfirmPasswordDialog._(
        title: title,
        description: description,
        caption: caption,
        confirmText: confirmText,
        cancelText: cancelText,
        confirmButtonColor: confirmButtonColor,
        onConfirm: onConfirm,
      ),
    );
  }

  @override
  ConsumerState<ConfirmPasswordDialog> createState() =>
      _ConfirmPasswordDialogState();
}

class _ConfirmPasswordDialogState extends ConsumerState<ConfirmPasswordDialog> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleConfirm() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final password = _passwordController.text.trim();
      final result = await widget.onConfirm(password);
      if (result && mounted) {
        Navigator.of(context).pop(true);
      }
    } on Exception {
      if (mounted) {
        context.showError(
          title: context.l10n.deleteAccountFailedTitle,
          subtitle: context.l10n.invalidPasswordMessage,
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return GLBaseDialog(
      title: Text(
        widget.title,
        textAlign: TextAlign.left,
        style: context.titleMedium,
      ),
      description: widget.description != null
          ? Text(
              widget.description!,
              textAlign: TextAlign.left,
              style: context.bodySmall.copyWith(
                color: GLColors.neutral600,
                fontWeight: FontWeight.w400,
              ),
            )
          : null,
      children: [
        if (widget.caption != null) ...[widget.caption!],
        GLSpaces.px8,
        Form(
          key: _formKey,
          child: TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            enabled: !_isLoading,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return l10n.passwordIsRequired;
              }
              return null;
            },
            decoration: InputDecoration(
              hintText: context.l10n.enterYourPassword,
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_off : Icons.visibility,
                  color: const Color(0xFF6B7280),
                ),
                onPressed: () {
                  setState(() => _obscurePassword = !_obscurePassword);
                },
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.r),
                borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.r),
                borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.r),
                borderSide: const BorderSide(
                  color: Color(0xFF12251B),
                  width: 2,
                ),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.r),
                borderSide: const BorderSide(color: Colors.red),
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.r),
                borderSide: const BorderSide(color: Colors.red, width: 2),
              ),
              contentPadding: EdgeInsets.symmetric(
                horizontal: 12.w,
                vertical: 12.h,
              ),
            ),
          ),
        ),
        GLSpaces.px12,
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            OutlinedButton(
              onPressed: _isLoading ? null : () => context.pop(false),
              style: GLButtonStyles.outlineM.copyWith(
                fixedSize: WidgetStatePropertyAll(Size.fromHeight(30.h)),
              ),
              child: Text(widget.cancelText ?? l10n.cancel),
            ),
            GLSpaces.px8,
            Expanded(
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleConfirm,
                style: GLButtonStyles.errorM.copyWith(
                  fixedSize: WidgetStatePropertyAll(Size.fromHeight(30.h)),
                ),
                child: _isLoading
                    ? SizedBox(
                        width: 16.w,
                        height: 16.h,
                        child: const CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : Text(widget.confirmText ?? l10n.deleteAccount),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
