// ignore_for_file: public_member_api_docs
import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class GLButtonStyles {
  GLButtonStyles._();

  // ==== PADDINGS ====
  static final _paddingXL = EdgeInsets.symmetric(
    horizontal: 16.w,
    vertical: 16.h,
  );
  static final _paddingL = EdgeInsets.symmetric(
    horizontal: 16.w,
    vertical: 12.h,
  );
  static final _paddingM = EdgeInsets.symmetric(
    horizontal: 12.w,
    vertical: 5.h,
  );
  static final _paddingS = EdgeInsets.symmetric(
    horizontal: 12.w,
    vertical: 6.h,
  );
  static final _paddingXS = EdgeInsets.symmetric(
    horizontal: 10.w,
    vertical: 4.h,
  );

  // ==== TEXT STYLES ====
  static final _textStyleXL = GLTextStyles.labelLarge.copyWith(
    fontWeight: FontWeight.w900,
  );
  static final _textStyleL = GLTextStyles.labelLarge.copyWith(
    fontWeight: FontWeight.w500,
  );
  static const _textStyleM = GLTextStyles.labelLarge;
  static final _textStyleS = GLTextStyles.labelSmall.copyWith(fontSize: 12.sp);
  static final _textStyleXS = GLTextStyles.labelSmall.copyWith(fontSize: 10.sp);
  static final _sizeM = Size.fromHeight(32.h);

  // ===== PRIMARY =====
  static ButtonStyle get primaryXL =>
      _primaryStyle(padding: _paddingXL, textStyle: _textStyleXL);

  static ButtonStyle get primaryL =>
      _primaryStyle(padding: _paddingL, textStyle: _textStyleL);

  static ButtonStyle get primaryM =>
      _primaryStyle(padding: _paddingM, textStyle: _textStyleM, size: _sizeM);

  static ButtonStyle get primaryS =>
      _primaryStyle(padding: _paddingS, textStyle: _textStyleS);

  static ButtonStyle get primaryXS =>
      _primaryStyle(padding: _paddingXS, textStyle: _textStyleXS);

  // ===== SECONDARY =====
  static ButtonStyle get secondaryXL =>
      _secondaryStyle(padding: _paddingXL, textStyle: _textStyleXL);

  static ButtonStyle get secondaryL =>
      _secondaryStyle(padding: _paddingL, textStyle: _textStyleL);

  static ButtonStyle get secondaryM => _secondaryStyle(
    padding: _paddingM,
    textStyle: _textStyleM,
    fixedSize: _sizeM,
  );

  static ButtonStyle get secondaryS =>
      _secondaryStyle(padding: _paddingS, textStyle: _textStyleS);

  static ButtonStyle get secondaryXS =>
      _secondaryStyle(padding: _paddingXS, textStyle: _textStyleXS);

  // ===== OUTLINE =====
  static ButtonStyle get outlineXL =>
      _outlineStyle(padding: _paddingXL, textStyle: _textStyleXL);

  static ButtonStyle get outlineL =>
      _outlineStyle(padding: _paddingL, textStyle: _textStyleL);

  static ButtonStyle get outlineM => _outlineStyle(
    padding: _paddingM,
    textStyle: _textStyleM,
    fixedSize: _sizeM,
  );

  static ButtonStyle get outlineS =>
      _outlineStyle(padding: _paddingS, textStyle: _textStyleS);

  static ButtonStyle get outlineXS =>
      _outlineStyle(padding: _paddingXS, textStyle: _textStyleXS);

  // ===== ERROR =====
  static ButtonStyle get errorXL =>
      _errorStyle(padding: _paddingXL, textStyle: _textStyleXL);

  static ButtonStyle get errorL =>
      _errorStyle(padding: _paddingL, textStyle: _textStyleL);

  static ButtonStyle get errorM => _errorStyle(
    padding: _paddingM,
    textStyle: _textStyleM,
    fixedSize: _sizeM,
  );

  static ButtonStyle get errorS =>
      _errorStyle(padding: _paddingS, textStyle: _textStyleS);

  static ButtonStyle get errorXS =>
      _errorStyle(padding: _paddingXS, textStyle: _textStyleXS);

  // ===== LINK =====
  static ButtonStyle get linkXL =>
      _linkStyle(textStyle: _textStyleXL, padding: _paddingXL);

  static ButtonStyle get linkL =>
      _linkStyle(textStyle: _textStyleL, padding: _paddingL);

  static ButtonStyle get linkM =>
      _linkStyle(textStyle: _textStyleM, fixedSize: _sizeM, padding: _paddingM);

  static ButtonStyle get linkS =>
      _linkStyle(textStyle: _textStyleS, padding: _paddingS);

  static ButtonStyle get linkXS =>
      _linkStyle(textStyle: _textStyleXS, padding: _paddingXS);

  // ===== ERROR LINK =====
  static ButtonStyle get errorLinkXL => _linkStyle(
    textStyle: _textStyleXL,
    color: GLColors.error500,
    padding: _paddingXL,
  );

  static ButtonStyle get errorLinkL => _linkStyle(
    textStyle: _textStyleL,
    color: GLColors.error500,
    padding: _paddingL,
  );

  static ButtonStyle get errorLinkM => _linkStyle(
    textStyle: _textStyleM,
    color: GLColors.error500,
    fixedSize: _sizeM,
    padding: _paddingM,
  );

  static ButtonStyle get errorLinkS => _linkStyle(
    textStyle: _textStyleS,
    color: GLColors.error500,
    padding: _paddingS,
  );

  static ButtonStyle get errorLinkXS => _linkStyle(
    textStyle: _textStyleXS,
    color: GLColors.error500,
    padding: _paddingXS,
  );

  // ===== BASE STYLES =====
  static ButtonStyle _primaryStyle({
    required EdgeInsets padding,
    required TextStyle textStyle,
    Size? size,
  }) {
    return ButtonStyle(
      fixedSize: WidgetStatePropertyAll(size),
      textStyle: WidgetStatePropertyAll(textStyle),
      backgroundColor: WidgetStateColor.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) return GLColors.neutral1100;
        return GLColors.brand500;
      }),
      foregroundColor: WidgetStateColor.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) return GLColors.neutral900;
        return Colors.white;
      }),
      minimumSize: const WidgetStatePropertyAll(Size.zero),
      overlayColor: const WidgetStatePropertyAll(GLColors.brand600),
      padding: WidgetStatePropertyAll(padding),
      shape: WidgetStatePropertyAll(
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.r)),
      ),
    );
  }

  static ButtonStyle _secondaryStyle({
    required EdgeInsets padding,
    required TextStyle textStyle,
    Size? fixedSize,
  }) {
    return ButtonStyle(
      fixedSize: WidgetStatePropertyAll(fixedSize),
      textStyle: WidgetStatePropertyAll(textStyle),
      backgroundColor: WidgetStateColor.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) return GLColors.neutral1100;
        return GLColors.brand50;
      }),
      foregroundColor: WidgetStateColor.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) return GLColors.neutral900;
        return GLColors.brand500;
      }),
      side: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) {
          return const BorderSide(color: GLColors.neutral1100);
        }
        return const BorderSide(color: GLColors.brand50);
      }),
      minimumSize: const WidgetStatePropertyAll(Size.zero),
      overlayColor: const WidgetStatePropertyAll(GLColors.brand100),
      padding: WidgetStatePropertyAll(padding),
      shape: WidgetStatePropertyAll(
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.r)),
      ),
    );
  }

  static ButtonStyle _outlineStyle({
    required EdgeInsets padding,
    required TextStyle textStyle,
    Size? fixedSize,
  }) {
    return ButtonStyle(
      fixedSize: WidgetStatePropertyAll(fixedSize),
      textStyle: WidgetStatePropertyAll(textStyle),
      backgroundColor: WidgetStateColor.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) return GLColors.neutral1100;
        return Colors.transparent;
      }),
      foregroundColor: WidgetStateColor.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) return GLColors.neutral900;
        return GLColors.brand500;
      }),
      overlayColor: const WidgetStatePropertyAll(GLColors.brand50),
      side: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) {
          return const BorderSide(color: GLColors.neutral1100);
        }
        return const BorderSide(color: GLColors.brand500);
      }),
      minimumSize: const WidgetStatePropertyAll(Size.zero),
      padding: WidgetStatePropertyAll(padding),
      shape: WidgetStatePropertyAll(
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.r)),
      ),
    );
  }

  static ButtonStyle _errorStyle({
    required EdgeInsets padding,
    required TextStyle textStyle,
    Size? fixedSize,
  }) {
    return ButtonStyle(
      fixedSize: WidgetStatePropertyAll(fixedSize),
      textStyle: WidgetStatePropertyAll(textStyle),
      backgroundColor: WidgetStateColor.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) return GLColors.neutral200;
        return GLColors.error500;
      }),
      minimumSize: const WidgetStatePropertyAll(Size.zero),
      foregroundColor: WidgetStateColor.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) return GLColors.neutral400;
        return Colors.white;
      }),
      overlayColor: const WidgetStatePropertyAll(GLColors.error600),
      padding: WidgetStatePropertyAll(padding),
      shape: WidgetStatePropertyAll(
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.r)),
      ),
    );
  }

  static ButtonStyle _linkStyle({
    required TextStyle textStyle,
    required EdgeInsets padding,
    Color? color,
    Size? fixedSize,
  }) {
    final resolvedColor = color ?? GLColors.brand500;
    return ButtonStyle(
      fixedSize: WidgetStatePropertyAll(fixedSize),
      textStyle: WidgetStatePropertyAll(textStyle),
      foregroundColor: WidgetStateColor.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) return GLColors.neutral400;
        return resolvedColor;
      }),
      minimumSize: const WidgetStatePropertyAll(Size.zero),
      overlayColor: WidgetStatePropertyAll(resolvedColor.withOpacity(0.08)),
      padding: WidgetStatePropertyAll(padding),
      shape: WidgetStatePropertyAll(
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.r)),
      ),
    );
  }
}
