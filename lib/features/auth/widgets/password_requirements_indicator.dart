import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';

class PasswordRequirementsIndicator extends StatelessWidget {
  const PasswordRequirementsIndicator({
    required this.password,
    super.key,
  });

  final String password;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _Requirement(
          met: FormValidator.hasRequiredPasswordCharacters(password),
          text:
              'Must include uppercase, lowercase, numbers, and special '
              'characters (e.g., !, @, #).',
        ),
        GLSpaces.px4,
        _Requirement(
          met: FormValidator.hasMinimumPasswordLength(password),
          text: 'Minimum 8 characters (12+ recommended).',
        ),
      ],
    );
  }
}

class _Requirement extends StatelessWidget {
  const _Requirement({
    required this.met,
    required this.text,
  });

  final bool met;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          met ? Icons.check_circle : Icons.cancel,
          color: met
              ? GLColors.successSwatch.shade400
              : GLColors.errorSwatch.shade400,
          size: 10.sp,
        ),
        GLSpaces.px4,
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: context.hintColor,
              fontSize: 10.sp,
              fontWeight: FontWeight.w400,
              height: 1.1,
            ),
          ),
        ),
      ],
    );
  }
}
