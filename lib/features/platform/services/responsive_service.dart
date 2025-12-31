import 'package:flutter/material.dart';

/// Breakpoints for responsive design
class Breakpoints {
  static const double mobile = 600;
  static const double tablet = 900;
  static const double desktop = 1200;
  static const double largeDesktop = 1800;
}

/// Device type based on screen size
enum DeviceType {
  mobile,
  tablet,
  desktop,
  largeDesktop,
}

/// Orientation-aware layout info
class LayoutInfo {
  final DeviceType deviceType;
  final bool isPortrait;
  final bool isLandscape;
  final double screenWidth;
  final double screenHeight;
  final bool isMobile;
  final bool isTablet;
  final bool isDesktop;
  final int columns;
  final double contentMaxWidth;
  final EdgeInsets contentPadding;

  LayoutInfo({
    required this.deviceType,
    required this.isPortrait,
    required this.screenWidth,
    required this.screenHeight,
  })  : isLandscape = !isPortrait,
        isMobile = deviceType == DeviceType.mobile,
        isTablet = deviceType == DeviceType.tablet,
        isDesktop =
            deviceType == DeviceType.desktop || deviceType == DeviceType.largeDesktop,
        columns = _getColumns(deviceType),
        contentMaxWidth = _getContentMaxWidth(deviceType),
        contentPadding = _getContentPadding(deviceType);

  static int _getColumns(DeviceType type) {
    switch (type) {
      case DeviceType.mobile:
        return 1;
      case DeviceType.tablet:
        return 2;
      case DeviceType.desktop:
        return 3;
      case DeviceType.largeDesktop:
        return 4;
    }
  }

  static double _getContentMaxWidth(DeviceType type) {
    switch (type) {
      case DeviceType.mobile:
        return double.infinity;
      case DeviceType.tablet:
        return 800;
      case DeviceType.desktop:
        return 1200;
      case DeviceType.largeDesktop:
        return 1600;
    }
  }

  static EdgeInsets _getContentPadding(DeviceType type) {
    switch (type) {
      case DeviceType.mobile:
        return const EdgeInsets.all(16);
      case DeviceType.tablet:
        return const EdgeInsets.all(24);
      case DeviceType.desktop:
        return const EdgeInsets.all(32);
      case DeviceType.largeDesktop:
        return const EdgeInsets.all(40);
    }
  }
}

/// Service for responsive layout utilities
class ResponsiveService {
  /// Gets device type from screen width
  static DeviceType getDeviceType(double width) {
    if (width < Breakpoints.mobile) {
      return DeviceType.mobile;
    } else if (width < Breakpoints.tablet) {
      return DeviceType.tablet;
    } else if (width < Breakpoints.desktop) {
      return DeviceType.desktop;
    } else {
      return DeviceType.largeDesktop;
    }
  }

  /// Gets layout info from BuildContext
  static LayoutInfo getLayoutInfo(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final orientation = MediaQuery.of(context).orientation;

    return LayoutInfo(
      deviceType: getDeviceType(size.width),
      isPortrait: orientation == Orientation.portrait,
      screenWidth: size.width,
      screenHeight: size.height,
    );
  }

  /// Checks if should use bottom navigation (mobile) or side navigation
  static bool shouldUseBottomNav(BuildContext context) {
    return getLayoutInfo(context).isMobile;
  }

  /// Checks if should use drawer navigation
  static bool shouldUseDrawer(BuildContext context) {
    final layout = getLayoutInfo(context);
    return layout.isTablet;
  }

  /// Checks if should use permanent side navigation
  static bool shouldUsePermanentNav(BuildContext context) {
    return getLayoutInfo(context).isDesktop;
  }

  /// Gets grid column count for content
  static int getGridColumns(BuildContext context) {
    return getLayoutInfo(context).columns;
  }

  /// Gets appropriate font scale for device
  static double getFontScale(BuildContext context) {
    final layout = getLayoutInfo(context);
    if (layout.isMobile) return 1.0;
    if (layout.isTablet) return 1.05;
    return 1.1;
  }

  /// Gets appropriate icon size for device
  static double getIconSize(BuildContext context, {double base = 24}) {
    final layout = getLayoutInfo(context);
    if (layout.isMobile) return base;
    if (layout.isTablet) return base * 1.1;
    return base * 1.2;
  }
}

/// Widget that provides responsive layout based on screen size
class ResponsiveBuilder extends StatelessWidget {
  const ResponsiveBuilder({
    required this.mobile,
    this.tablet,
    this.desktop,
    super.key,
  });

  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;

  @override
  Widget build(BuildContext context) {
    final layout = ResponsiveService.getLayoutInfo(context);

    if (layout.isDesktop && desktop != null) {
      return desktop!;
    }
    if (layout.isTablet && tablet != null) {
      return tablet!;
    }
    return mobile;
  }
}

/// Widget that constrains content to max width
class ResponsiveContent extends StatelessWidget {
  const ResponsiveContent({
    required this.child,
    this.maxWidth,
    this.padding,
    this.center = true,
    super.key,
  });

  final Widget child;
  final double? maxWidth;
  final EdgeInsets? padding;
  final bool center;

  @override
  Widget build(BuildContext context) {
    final layout = ResponsiveService.getLayoutInfo(context);
    final effectiveMaxWidth = maxWidth ?? layout.contentMaxWidth;
    final effectivePadding = padding ?? layout.contentPadding;

    Widget content = Padding(
      padding: effectivePadding,
      child: child,
    );

    if (effectiveMaxWidth != double.infinity) {
      content = ConstrainedBox(
        constraints: BoxConstraints(maxWidth: effectiveMaxWidth),
        child: content,
      );

      if (center) {
        content = Center(child: content);
      }
    }

    return content;
  }
}

/// Adaptive grid that adjusts columns based on screen size
class ResponsiveGrid extends StatelessWidget {
  const ResponsiveGrid({
    required this.children,
    this.spacing = 16,
    this.runSpacing = 16,
    this.minChildWidth = 300,
    super.key,
  });

  final List<Widget> children;
  final double spacing;
  final double runSpacing;
  final double minChildWidth;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = (constraints.maxWidth / minChildWidth).floor().clamp(1, 4);
        final childWidth =
            (constraints.maxWidth - (spacing * (columns - 1))) / columns;

        return Wrap(
          spacing: spacing,
          runSpacing: runSpacing,
          children: children.map((child) {
            return SizedBox(
              width: childWidth,
              child: child,
            );
          }).toList(),
        );
      },
    );
  }
}
