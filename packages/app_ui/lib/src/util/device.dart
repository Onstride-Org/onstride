import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Abstract class to get device info
abstract class Device {
  static final _device = DeviceInfoPlugin();

  /// Get if the application is running in a tablet or phone
  static Future<bool> isTablet(BuildContext context) async {
    if (kIsWeb) {
      // On web, use screen size heuristic
      final shortestSide = MediaQuery.of(context).size.shortestSide;
      return shortestSide > 600;
    }

    // Use defaultTargetPlatform instead of dart:io Platform
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      final iosInfo = await _device.iosInfo;
      return iosInfo.model.toLowerCase() == 'ipad';
    } else {
      final shortestSide = MediaQuery.of(context).size.shortestSide;
      return shortestSide > 600;
    }
  }
}
