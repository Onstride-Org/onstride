/// GENERATED CODE - DO NOT MODIFY BY HAND
/// *****************************************************
///  FlutterGen
/// *****************************************************

// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: directives_ordering,unnecessary_import

import 'package:flutter/widgets.dart';

class $AssetsIconsGen {
  const $AssetsIconsGen();

  /// File path: assets/icons/alert.png
  AssetGenImage get alert => const AssetGenImage('assets/icons/alert.png');

  /// File path: assets/icons/android_launch_icon_baseball.png
  AssetGenImage get androidLaunchIconBaseball =>
      const AssetGenImage('assets/icons/android_launch_icon_baseball.png');

  /// File path: assets/icons/android_launch_icon_golf.png
  AssetGenImage get androidLaunchIconGolf =>
      const AssetGenImage('assets/icons/android_launch_icon_golf.png');

  /// File path: assets/icons/baseball_splash.png
  AssetGenImage get baseballSplash =>
      const AssetGenImage('assets/icons/baseball_splash.png');

  /// File path: assets/icons/google.png
  AssetGenImage get google => const AssetGenImage('assets/icons/google.png');

  /// File path: assets/icons/launch_icon_baseball.png
  AssetGenImage get launchIconBaseball =>
      const AssetGenImage('assets/icons/launch_icon_baseball.png');

  /// File path: assets/icons/launch_icon_golf.png
  AssetGenImage get launchIconGolf =>
      const AssetGenImage('assets/icons/launch_icon_golf.png');

  /// File path: assets/icons/splash_icon_baseball.png
  AssetGenImage get splashIconBaseball =>
      const AssetGenImage('assets/icons/splash_icon_baseball.png');
}

class $AssetsImagesGen {
  const $AssetsImagesGen();

  /// File path: assets/images/home_dark.jpg
  AssetGenImage get homeDark =>
      const AssetGenImage('assets/images/home_dark.jpg');

  /// File path: assets/images/home_light.jpg
  AssetGenImage get homeLight =>
      const AssetGenImage('assets/images/home_light.jpg');

  /// File path: assets/images/info_dark.jpg
  AssetGenImage get infoDark =>
      const AssetGenImage('assets/images/info_dark.jpg');

  /// File path: assets/images/info_light.jpg
  AssetGenImage get infoLight =>
      const AssetGenImage('assets/images/info_light.jpg');

  /// File path: assets/images/logo_horizontal_black.png
  AssetGenImage get logoHorizontalBlack =>
      const AssetGenImage('assets/images/logo_horizontal_black.png');
}

class $AssetsTranslationsGen {
  const $AssetsTranslationsGen();

  /// File path: assets/translations/de.json
  String get de => 'assets/translations/de.json';

  /// File path: assets/translations/en.json
  String get en => 'assets/translations/en.json';
}

class Assets {
  Assets._();

  static const $AssetsIconsGen icons = $AssetsIconsGen();
  static const $AssetsImagesGen images = $AssetsImagesGen();
  static const $AssetsTranslationsGen translations = $AssetsTranslationsGen();
}

class AssetGenImage {
  const AssetGenImage(this._assetName);

  final String _assetName;

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
    bool gaplessPlayback = false,
    bool isAntiAlias = false,
    String? package,
    FilterQuality filterQuality = FilterQuality.low,
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

  String get path => _assetName;

  String get keyName => _assetName;
}
