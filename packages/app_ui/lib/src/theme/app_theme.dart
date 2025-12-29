// ignore_for_file: public_member_api_docs

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

mixin GLTheme {
  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: GLColors.lightColorScheme,
    canvasColor: Colors.white,
    fontFamily: 'Inter',
    package: 'app_ui',
    disabledColor: GLColors.neutral1000,
    primaryColorLight: GLColors.brand100,
    shadowColor: GLColors.shadowColor,
    primaryColorDark: GLColors.brand700,
    scaffoldBackgroundColor: Colors.white,
    hintColor: GLColors.neutral800,
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      scrolledUnderElevation: 0,
      systemOverlayStyle: SystemUiOverlayStyle.dark,
      elevation: 0,
      toolbarHeight: 70,
      titleSpacing: 24,
      iconTheme: IconThemeData(color: GLColors.lightColorScheme.primary),
      actionsIconTheme: IconThemeData(color: GLColors.lightColorScheme.primary),
      centerTitle: true,
      titleTextStyle: GLTextStyles.titleMedium.copyWith(
        color: GLColors.neutral50,
        fontWeight: FontWeight.w500,
        fontSize: 18,
      ),
    ),
    dropdownMenuTheme: DropdownMenuThemeData(
      menuStyle: MenuStyle(
        backgroundColor: WidgetStateProperty.all(Colors.white),
        elevation: WidgetStateProperty.all(3),
        shape: WidgetStateProperty.all(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10), // borderRadius global
          ),
        ),
        padding: WidgetStateProperty.all(EdgeInsets.zero),
      ),
      textStyle: const TextStyle(fontSize: 14, overflow: TextOverflow.ellipsis),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        hintStyle: GLTextStyles.bodyMedium.copyWith(
          color: GLColors.neutral800,
          fontWeight: FontWeight.w400,
        ),
        counterStyle: GLTextStyles.labelSmall.copyWith(
          fontWeight: FontWeight.w400,
          color: GLColors.neutral800,
        ),
      ),
    ),

    popupMenuTheme: PopupMenuThemeData(
      textStyle: GLTextStyles.bodyMedium,
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: 10.borderRadiusA),
      shadowColor: GLColors.shadowColor,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: GLButtonStyles.primaryL,
    ),
    inputDecorationTheme: inputDecorationTheme,
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: GLButtonStyles.outlineL,
    ),

    textTheme: TextTheme(
      displayLarge: GLTextStyles.displayLarge,
      displayMedium: GLTextStyles.displayMedium,
      displaySmall: GLTextStyles.displaySmall,
      headlineLarge: GLTextStyles.headlineLarge.copyWith(
        fontWeight: FontWeight.w800,
      ),
      headlineMedium: GLTextStyles.headlineMedium,
      headlineSmall: GLTextStyles.headlineSmall,
      titleLarge: GLTextStyles.titleLarge,
      titleMedium: GLTextStyles.titleMedium,
      titleSmall: GLTextStyles.titleSmall,
      bodyLarge: GLTextStyles.bodyMedium,
      bodyMedium: GLTextStyles.bodyMedium,
      bodySmall: GLTextStyles.bodySmall,
      labelLarge: GLTextStyles.labelLarge,
      labelMedium: GLTextStyles.labelMedium,
      labelSmall: GLTextStyles.labelSmall,
    )..apply(bodyColor: GLColors.neutral50, displayColor: GLColors.neutral50),
    scrollbarTheme: const ScrollbarThemeData(
      thumbVisibility: WidgetStatePropertyAll(true),
      thickness: WidgetStatePropertyAll(3),
      radius: Radius.circular(8),
      thumbColor: WidgetStatePropertyAll(GLColors.neutral800),
      trackColor: WidgetStatePropertyAll(GLColors.neutral800),
    ),
  );

  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    colorScheme: GLColors.darkColorScheme,
    canvasColor: GLColors.darkColorScheme.background,
    fontFamily: 'Inter',
    appBarTheme: AppBarTheme(
      backgroundColor: GLColors.darkColorScheme.background,
      iconTheme: IconThemeData(color: GLColors.darkColorScheme.primary),
      actionsIconTheme: IconThemeData(color: GLColors.darkColorScheme.primary),
      centerTitle: true,
      elevation: 0,
      titleTextStyle: GLTextStyles.titleMedium.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
        fontWeight: FontWeight.w700,
        fontSize: 18,
      ),
    ),
    textTheme: TextTheme(
      displayLarge: GLTextStyles.displayLarge.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
      ),
      displayMedium: GLTextStyles.displayMedium.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
      ),
      displaySmall: GLTextStyles.displaySmall.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
      ),
      headlineLarge: GLTextStyles.headlineLarge.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
      ),
      headlineMedium: GLTextStyles.headlineMedium.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
      ),
      headlineSmall: GLTextStyles.headlineSmall.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
      ),
      titleLarge: GLTextStyles.titleLarge.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
      ),
      titleMedium: GLTextStyles.titleMedium.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
        fontWeight: FontWeight.w700,
      ),
      titleSmall: GLTextStyles.titleSmall.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
      ),
      bodyLarge: GLTextStyles.bodyLarge.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
        fontSize: 18,
      ),
      bodyMedium: GLTextStyles.bodyMedium.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
        fontSize: 16,
        letterSpacing: -0.6,
      ),
      bodySmall: GLTextStyles.bodySmall.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
        fontSize: 13,
      ),
      labelLarge: GLTextStyles.labelLarge.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
      ),
      labelMedium: GLTextStyles.labelMedium.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
      ),
      labelSmall: GLTextStyles.labelSmall.copyWith(
        color: GLColors.neutralDarkSwatch.shade100,
      ),
    ),
  );
  static final inputDecorationTheme = InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    contentPadding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8.r),
      borderSide: const BorderSide(color: GLColors.neutral800),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8.r),
      borderSide: const BorderSide(color: GLColors.neutral800),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8.r),
      borderSide: const BorderSide(color: GLColors.brand500),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8.r),
      borderSide: const BorderSide(color: GLColors.error500),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8.r),
      borderSide: const BorderSide(color: GLColors.error500),
    ),
    disabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8.r),
      borderSide: const BorderSide(color: GLColors.neutral1000),
    ),
    iconColor: GLColors.neutral800,
    suffixIconColor: GLColors.neutral800,
    hintStyle: GLTextStyles.bodyMedium.copyWith(
      color: GLColors.neutral800,
      fontWeight: FontWeight.w400,
    ),
    counterStyle: GLTextStyles.labelSmall.copyWith(
      fontWeight: FontWeight.w400,
      color: GLColors.neutral800,
    ),
    labelStyle: GLTextStyles.bodyMedium.copyWith(
      color: GLColors.neutral800,
      fontWeight: FontWeight.w400,
    ),
    helperStyle: GLTextStyles.labelSmall.copyWith(
      color: GLColors.neutral800,
      fontWeight: FontWeight.w400,
    ),
    errorStyle: GLTextStyles.labelSmall.copyWith(
      color: GLColors.error500,
      fontWeight: FontWeight.w400,
    ),
  );
}
