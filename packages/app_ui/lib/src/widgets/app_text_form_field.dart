// ignore_for_file: public_member_api_docs

import 'package:flutter/material.dart';

class AppTextFormField extends StatelessWidget {
  const AppTextFormField({
    super.key,
    required this.controller,
    this.isObscureText = false,
    this.validator,
    required this.hintText,
    this.label,
    this.keyboardType,
    this.suffixIcon,
    this.onChanged,
  });

  final TextEditingController controller;
  final TextInputType? keyboardType;
  final bool isObscureText;
  final String? Function(String?)? validator;
  final String? Function(String?)? onChanged;
  final String? label;
  final String hintText;
  final Widget? suffixIcon;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      obscureText: isObscureText,
      validator: validator,
      onChanged: onChanged,
      keyboardType: keyboardType,
      textCapitalization: keyboardType == TextInputType.name
          ? TextCapitalization.words
          : keyboardType == TextInputType.emailAddress
              ? TextCapitalization.none
              : TextCapitalization.sentences,
      style: Theme.of(context).textTheme.bodyMedium,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: Theme.of(context).textTheme.bodyMedium,
        suffixIcon: suffixIcon,
      ),
    );
  }
}
