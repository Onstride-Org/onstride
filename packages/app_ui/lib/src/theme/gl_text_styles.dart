// ignore_for_file: avoid_classes_with_only_static_members
// ignore_for_file: public_member_api_docs

import 'package:flutter/material.dart';

mixin GLTextStyles {
  static const _fontFamily = 'Inter';
  static const _package = 'app_ui';

  // Display
  static const displayLarge = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 57,
    fontWeight: FontWeight.w500,
    letterSpacing: -0.25,
    height: 1.12,
  );

  static const displayMedium = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 45,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
    height: 1.16,
  );

  static const displaySmall = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 36,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
    height: 1.22,
  );

  // Headline
  static const headlineLarge = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 32,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
    height: 1.25,
  );

  static const headlineMedium = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 28,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
    height: 1.29,
  );

  static const headlineSmall = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 24,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
    height: 1.33,
  );

  // Title
  static const titleLarge = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 22,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
    height: 1.27,
  );

  static const titleMedium = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
    height: 1.5,
  );

  static const titleSmall = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 15,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.1,
    height: 1.5,
  );

  // Label
  static const labelLarge = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.43,
  );

  static const labelMedium = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.25,
    height: 1.33,
  );

  static const labelSmall = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.25,
    height: 1.45,
  );

  // Body
  static const bodyLarge = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 16,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.25,
    height: 1.5,
  );

  static const bodyMedium = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.25,
    height: 1.43,
  );

  static const bodySmall = TextStyle(
    fontFamily: _fontFamily,
    package: _package,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.4,
    height: 1.33,
  );
}
