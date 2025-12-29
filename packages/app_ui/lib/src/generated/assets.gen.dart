// dart format width=80

/// GENERATED CODE - DO NOT MODIFY BY HAND
/// *****************************************************
///  FlutterGen
/// *****************************************************

// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: deprecated_member_use,directives_ordering,implicit_dynamic_list_literal,unnecessary_import

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_svg/flutter_svg.dart' as _svg;
import 'package:vector_graphics/vector_graphics.dart' as _vg;

class $AssetsCreditCardsGen {
  const $AssetsCreditCardsGen();

  /// File path: assets/credit_cards/alipay.svg
  SvgGenImage get alipay => const SvgGenImage('assets/credit_cards/alipay.svg');

  /// File path: assets/credit_cards/amex.svg
  SvgGenImage get amex => const SvgGenImage('assets/credit_cards/amex.svg');

  /// File path: assets/credit_cards/code-front.svg
  SvgGenImage get codeFront =>
      const SvgGenImage('assets/credit_cards/code-front.svg');

  /// File path: assets/credit_cards/code.svg
  SvgGenImage get code => const SvgGenImage('assets/credit_cards/code.svg');

  /// File path: assets/credit_cards/diners.svg
  SvgGenImage get diners => const SvgGenImage('assets/credit_cards/diners.svg');

  /// File path: assets/credit_cards/discover.svg
  SvgGenImage get discover =>
      const SvgGenImage('assets/credit_cards/discover.svg');

  /// File path: assets/credit_cards/elo.svg
  SvgGenImage get elo => const SvgGenImage('assets/credit_cards/elo.svg');

  /// File path: assets/credit_cards/generic.svg
  SvgGenImage get generic =>
      const SvgGenImage('assets/credit_cards/generic.svg');

  /// File path: assets/credit_cards/hiper.svg
  SvgGenImage get hiper => const SvgGenImage('assets/credit_cards/hiper.svg');

  /// File path: assets/credit_cards/hipercard.svg
  SvgGenImage get hipercard =>
      const SvgGenImage('assets/credit_cards/hipercard.svg');

  /// File path: assets/credit_cards/jcb.svg
  SvgGenImage get jcb => const SvgGenImage('assets/credit_cards/jcb.svg');

  /// File path: assets/credit_cards/maestro.svg
  SvgGenImage get maestro =>
      const SvgGenImage('assets/credit_cards/maestro.svg');

  /// File path: assets/credit_cards/mastercard.svg
  SvgGenImage get mastercard =>
      const SvgGenImage('assets/credit_cards/mastercard.svg');

  /// File path: assets/credit_cards/mir.svg
  SvgGenImage get mir => const SvgGenImage('assets/credit_cards/mir.svg');

  /// File path: assets/credit_cards/paypal.svg
  SvgGenImage get paypal => const SvgGenImage('assets/credit_cards/paypal.svg');

  /// File path: assets/credit_cards/unionpay.svg
  SvgGenImage get unionpay =>
      const SvgGenImage('assets/credit_cards/unionpay.svg');

  /// File path: assets/credit_cards/visa.svg
  SvgGenImage get visa => const SvgGenImage('assets/credit_cards/visa.svg');

  /// List of all assets
  List<SvgGenImage> get values => [
    alipay,
    amex,
    codeFront,
    code,
    diners,
    discover,
    elo,
    generic,
    hiper,
    hipercard,
    jcb,
    maestro,
    mastercard,
    mir,
    paypal,
    unionpay,
    visa,
  ];
}

class $AssetsImagesGen {
  const $AssetsImagesGen();

  /// File path: assets/images/empty.png
  AssetGenImage get empty => const AssetGenImage('assets/images/empty.png');

  /// File path: assets/images/icon.png
  AssetGenImage get icon => const AssetGenImage('assets/images/icon.png');

  /// File path: assets/images/icon_calendar.png
  AssetGenImage get iconCalendar =>
      const AssetGenImage('assets/images/icon_calendar.png');

  /// File path: assets/images/icon_dev.png
  AssetGenImage get iconDev =>
      const AssetGenImage('assets/images/icon_dev.png');

  /// File path: assets/images/icon_search.png
  AssetGenImage get iconSearch =>
      const AssetGenImage('assets/images/icon_search.png');

  /// File path: assets/images/icon_user.png
  AssetGenImage get iconUser =>
      const AssetGenImage('assets/images/icon_user.png');

  /// File path: assets/images/login_bg.jpg
  AssetGenImage get loginBg =>
      const AssetGenImage('assets/images/login_bg.jpg');

  /// File path: assets/images/text_logo.png
  AssetGenImage get textLogo =>
      const AssetGenImage('assets/images/text_logo.png');

  /// List of all assets
  List<AssetGenImage> get values => [
    empty,
    icon,
    iconCalendar,
    iconDev,
    iconSearch,
    iconUser,
    loginBg,
    textLogo,
  ];
}

class Assets {
  const Assets._();

  static const String package = 'app_ui';

  static const $AssetsCreditCardsGen creditCards = $AssetsCreditCardsGen();
  static const $AssetsImagesGen images = $AssetsImagesGen();
}

class AssetGenImage {
  const AssetGenImage(
    this._assetName, {
    this.size,
    this.flavors = const {},
    this.animation,
  });

  final String _assetName;

  static const String package = 'app_ui';

  final Size? size;
  final Set<String> flavors;
  final AssetGenImageAnimation? animation;

  Image image({
    Key? key,
    AssetBundle? bundle,
    ImageFrameBuilder? frameBuilder,
    ImageErrorWidgetBuilder? errorBuilder,
    String? semanticLabel,
    bool excludeFromSemantics = false,
    double? scale,
    double? width,
    double? height,
    Color? color,
    Animation<double>? opacity,
    BlendMode? colorBlendMode,
    BoxFit? fit,
    AlignmentGeometry alignment = Alignment.center,
    ImageRepeat repeat = ImageRepeat.noRepeat,
    Rect? centerSlice,
    bool matchTextDirection = false,
    bool gaplessPlayback = true,
    bool isAntiAlias = false,
    @Deprecated('Do not specify package for a generated library asset')
    String? package = package,
    FilterQuality filterQuality = FilterQuality.medium,
    int? cacheWidth,
    int? cacheHeight,
  }) {
    return Image.asset(
      _assetName,
      key: key,
      bundle: bundle,
      frameBuilder: frameBuilder,
      errorBuilder: errorBuilder,
      semanticLabel: semanticLabel,
      excludeFromSemantics: excludeFromSemantics,
      scale: scale,
      width: width,
      height: height,
      color: color,
      opacity: opacity,
      colorBlendMode: colorBlendMode,
      fit: fit,
      alignment: alignment,
      repeat: repeat,
      centerSlice: centerSlice,
      matchTextDirection: matchTextDirection,
      gaplessPlayback: gaplessPlayback,
      isAntiAlias: isAntiAlias,
      package: package,
      filterQuality: filterQuality,
      cacheWidth: cacheWidth,
      cacheHeight: cacheHeight,
    );
  }

  ImageProvider provider({
    AssetBundle? bundle,
    @Deprecated('Do not specify package for a generated library asset')
    String? package = package,
  }) {
    return AssetImage(_assetName, bundle: bundle, package: package);
  }

  String get path => _assetName;

  String get keyName => 'packages/app_ui/$_assetName';
}

class AssetGenImageAnimation {
  const AssetGenImageAnimation({
    required this.isAnimation,
    required this.duration,
    required this.frames,
  });

  final bool isAnimation;
  final Duration duration;
  final int frames;
}

class SvgGenImage {
  const SvgGenImage(this._assetName, {this.size, this.flavors = const {}})
    : _isVecFormat = false;

  const SvgGenImage.vec(this._assetName, {this.size, this.flavors = const {}})
    : _isVecFormat = true;

  final String _assetName;
  final Size? size;
  final Set<String> flavors;
  final bool _isVecFormat;

  static const String package = 'app_ui';

  _svg.SvgPicture svg({
    Key? key,
    bool matchTextDirection = false,
    AssetBundle? bundle,
    @Deprecated('Do not specify package for a generated library asset')
    String? package = package,
    double? width,
    double? height,
    BoxFit fit = BoxFit.contain,
    AlignmentGeometry alignment = Alignment.center,
    bool allowDrawingOutsideViewBox = false,
    WidgetBuilder? placeholderBuilder,
    String? semanticsLabel,
    bool excludeFromSemantics = false,
    _svg.SvgTheme? theme,
    _svg.ColorMapper? colorMapper,
    ColorFilter? colorFilter,
    Clip clipBehavior = Clip.hardEdge,
    @deprecated Color? color,
    @deprecated BlendMode colorBlendMode = BlendMode.srcIn,
    @deprecated bool cacheColorFilter = false,
  }) {
    final _svg.BytesLoader loader;
    if (_isVecFormat) {
      loader = _vg.AssetBytesLoader(
        _assetName,
        assetBundle: bundle,
        packageName: package,
      );
    } else {
      loader = _svg.SvgAssetLoader(
        _assetName,
        assetBundle: bundle,
        packageName: package,
        theme: theme,
        colorMapper: colorMapper,
      );
    }
    return _svg.SvgPicture(
      loader,
      key: key,
      matchTextDirection: matchTextDirection,
      width: width,
      height: height,
      fit: fit,
      alignment: alignment,
      allowDrawingOutsideViewBox: allowDrawingOutsideViewBox,
      placeholderBuilder: placeholderBuilder,
      semanticsLabel: semanticsLabel,
      excludeFromSemantics: excludeFromSemantics,
      colorFilter:
          colorFilter ??
          (color == null ? null : ColorFilter.mode(color, colorBlendMode)),
      clipBehavior: clipBehavior,
      cacheColorFilter: cacheColorFilter,
    );
  }

  String get path => _assetName;

  String get keyName => 'packages/app_ui/$_assetName';
}
