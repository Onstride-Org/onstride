// ignore_for_file: avoid_classes_with_only_static_members

import 'package:gap/gap.dart';

/// GLSpaces provides predefined spacing constants using [Gap] widgets.
/// These constants help maintain consistent spacing throughout the UI
/// and improve performance by reusing immutable widgets.
mixin GLSpaces {
  /// 0 pixels of spacing
  static const Gap zero = Gap(0);

  /// 1 pixel of spacing (single physical pixel)
  static const Gap px1 = Gap(1);

  /// Extra extra small spacing (2px)
  static const Gap px2 = Gap(2);

  /// Extra small 2 spacing (4px)
  static const Gap px4 = Gap(4);

  /// Extra small spacing (8px)
  static const Gap px8 = Gap(8);

  /// Small spacing (10px)
  static const Gap px10 = Gap(10);

  /// Small spacing (12px)
  static const Gap px12 = Gap(12);

  /// Base spacing (16px)
  static const Gap px16 = Gap(16);

  /// Medium spacing (20px)
  static const Gap px20 = Gap(20);

  /// Large spacing (24px)
  static const Gap px24 = Gap(24);

  /// Extra large spacing (28px)
  static const Gap px28 = Gap(28);

  /// Extra large 2 spacing (32px)
  static const Gap px32 = Gap(32);

  /// Extra large 3 spacing (40px)
  static const Gap px40 = Gap(40);

  /// Extra large 4 spacing (48px)
  static const Gap px48 = Gap(48);

  /// Extra large 5 spacing (60px)
  static const Gap px60 = Gap(60);

  /// Extra large 6 spacing (72px)
  static const Gap px72 = Gap(72);
}
