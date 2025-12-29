// ignore_for_file: avoid_classes_with_only_static_members
// ignore_for_file: public_member_api_docs

import 'package:flutter/material.dart';

class GLColors {
  GLColors._();

  // Brand Colors
  static const brand50 = Color(0xFFF4FDEF);
  static const brand100 = Color(0xFFA9EEC4);
  static const brand200 = Color(0xFF79AB8C);
  static const brand300 = Color(0xFF648F75);
  static const brand400 = Color(0xFF51755F);
  static const brand500 = Color(0xFF405D4B);
  static const brand600 = Color(0xFF2F4637);
  static const brand700 = Color(0xFF203126);
  static const brand800 = Color(0xFF0A130E);
  static const brand900 = Color(0xFF0A110D);

  static const brandSwatch = MaterialColor(0xFF00796B, <int, Color>{
    50: brand50,
    100: brand100,
    200: brand200,
    300: brand300,
    400: brand400,
    500: brand500,
    600: brand600,
    700: brand700,
    800: brand800,
    900: brand900,
  });

  // Neutral Colors
  static const neutral50 = Color(0xFF1D1D1D);
  static const neutral100 = Color(0xFF2D2D2D);
  static const neutral200 = Color(0xFF3C3C3C);
  static const neutral300 = Color(0xFF4A4A4A);
  static const neutral400 = Color(0xFF595959);
  static const neutral500 = Color(0xFF717171);
  static const neutral600 = Color(0xFF8A8A8A);
  static const neutral700 = Color(0xFFA3A3A3);
  static const neutral800 = Color(0xFFBCBCBC);
  static const neutral900 = Color(0xFFD6D6D6);
  static const neutral1000 = Color(0xFFE6E6E6);
  static const neutral1100 = Color(0xFFDEE4EA);

  static const neutral150A = Color.fromARGB(64, 228, 234, 240);
  static const neutral200A = Color.fromARGB(64, 223, 230, 238);
  static const neutral250A = Color.fromARGB(64, 220, 228, 236);
  static const neutral300A = Color.fromARGB(64, 214, 224, 233);
  static const neutral350A = Color.fromARGB(64, 209, 220, 231);
  static const neutral400A = Color.fromARGB(64, 204, 216, 229);
  static const neutral450A = Color.fromARGB(64, 198, 212, 228);

  static const neutralDarkSwatch = MaterialColor(0xFF1D1D1D, <int, Color>{
    50: neutral50,
    100: neutral100,
    200: neutral200,
    300: neutral300,
    400: neutral400,
    500: neutral500,
  });

  static const neutralLightSwatch = MaterialColor(0xFF717171, <int, Color>{
    500: neutral500,
    600: neutral600,
    700: neutral700,
    800: neutral800,
    900: neutral900,
  });

  // Error Colors
  static const error50 = Color(0xFFFFECEB);
  static const error100 = Color(0xFFFFB0AB);
  static const error200 = Color(0xFFFD9891);
  static const error300 = Color(0xFFF87168);
  static const error400 = Color(0xFFF15B50);
  static const error500 = Color(0xFFE2483D);
  static const error600 = Color(0xFFB62222);
  static const error700 = Color(0xFF961517);
  static const error800 = Color(0xFF791113);
  static const error900 = Color(0xFF590D0E);

  static const errorSwatch = MaterialColor(0xFFD2332B, <int, Color>{
    50: error50,
    100: error100,
    200: error200,
    300: error300,
    400: error400,
    500: error500,
    600: error600,
    700: error700,
    800: error800,
    900: error900,
  });

  // Warning Colors
  static const warning50 = Color(0xFFFFF7D6);
  static const warning100 = Color(0xFFFFF7D6);
  static const warning200 = Color(0xFFF8E6A0);
  static const warning300 = Color(0xFFF5CD47);
  static const warning400 = Color(0xFFE2B203);
  static const warning500 = Color(0xFFCF9F02);
  static const warning600 = Color(0xFFB38600);
  static const warning700 = Color(0xFF946F00);
  static const warning800 = Color(0xFF7F5F01);
  static const warning900 = Color(0xFF533F04);
  static const warningSwatch = MaterialColor(0xFFC19100, <int, Color>{
    50: warning50,
    100: warning100,
    200: warning200,
    300: warning300,
    400: warning400,
    500: warning500,
    600: warning600,
    700: warning700,
    800: warning800,
    900: warning900,
  });

  // Success Colors
  static const success50 = Color(0xFFDCFFF1);
  static const success100 = Color(0xFFBAF3DB);
  static const success200 = Color(0xFF7EE2B8);
  static const success300 = Color(0xFF4BCE97);
  static const success400 = Color(0xFF2ABB7F);
  static const success500 = Color(0xFF22A06B);
  static const success600 = Color(0xFF1F845A);
  static const success700 = Color(0xFF216E4E);
  static const success800 = Color(0xFF164B35);
  static const success900 = Color(0xFF1C3329);

  static const successSwatch = MaterialColor(0xFF16A175, <int, Color>{
    50: success50,
    100: success100,
    200: success200,
    300: success300,
    400: success400,
    500: success500,
    600: success600,
    700: success700,
    800: success800,
    900: success900,
  });
  static final lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: GLColors.brand500,
    onPrimary: Colors.white,
    primaryContainer: GLColors.brand100,
    onPrimaryContainer: GLColors.brand800,
    secondary: GLColors.neutral500,
    onSecondary: Colors.white,
    secondaryContainer: GLColors.neutral100,
    onSecondaryContainer: GLColors.neutral700,
    background: Colors.white,
    onBackground: GLColors.neutral100,
    surface: GLColors.neutral1000,
    onSurface: GLColors.neutral100,
    error: GLColors.error500,
    onError: Colors.white,
    errorContainer: GLColors.error100,
    onErrorContainer: GLColors.error700,
    surfaceVariant: GLColors.neutral200A,
    onSurfaceVariant: GLColors.neutral400,
    outline: GLColors.neutral300,
    outlineVariant: GLColors.neutral200,
    inverseSurface: GLColors.neutral100,
    onInverseSurface: GLColors.neutral800,
    inversePrimary: GLColors.brand200,
    shadow: shadowColor,
    scrim: shadowColor,
  );

  static final darkColorScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: GLColors.brand300,
    onPrimary: GLColors.neutral800,
    primaryContainer: GLColors.brand700,
    onPrimaryContainer: GLColors.neutral100,
    secondary: GLColors.neutral300,
    onSecondary: GLColors.neutral900,
    secondaryContainer: GLColors.neutral400,
    onSecondaryContainer: GLColors.neutral50,
    background: GLColors.neutral50,
    onBackground: GLColors.neutral900,
    surface: GLColors.neutral100,
    onSurface: GLColors.neutral900,
    error: GLColors.error300,
    onError: GLColors.neutral900,
    errorContainer: GLColors.error700,
    onErrorContainer: GLColors.neutral100,
    surfaceVariant: GLColors.neutral300A,
    onSurfaceVariant: GLColors.neutral800,
    outline: GLColors.neutral600,
    outlineVariant: GLColors.neutral400,
    inverseSurface: GLColors.neutral900,
    onInverseSurface: GLColors.neutral100,
    inversePrimary: GLColors.brand100,
    shadow: shadowColor,
    scrim: shadowColor,
  );

  static const shadowColor = Color(0x14000000);
}
