// ignore_for_file: public_member_api_docs
import 'dart:math' as math;
import 'package:flutter/material.dart';

class InitialsAvatar extends StatelessWidget {
  const InitialsAvatar({
    super.key,
    this.height = 18,
    this.iconSize = 15,
    this.hasBorder = false,
    this.hasElevation = true,
    this.fontColor,
    this.backgroundColor,
    this.fullName,
    this.avatarUrl,
  });
  final double height;
  final double iconSize;
  final String? avatarUrl;
  final String? fullName;
  final Color? fontColor;
  final Color? backgroundColor;
  final bool? hasBorder;
  final bool? hasElevation;

  @override
  Widget build(BuildContext context) {
    final generatedColor = math.Random().nextInt(Colors.primaries.length);
    final randomColor = Colors.primaries[generatedColor];
    final backColor = backgroundColor ?? randomColor;
    //Calculates color based on contrast with the background
    final foregroundColor =
        backColor.computeLuminance() > 0.5 ? Colors.black : Colors.white;
    final child = Text(
      getInitials(fullName ?? 'S U'),
      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
            color: fontColor ?? foregroundColor,
            fontSize: (height / 2) < 40 ? 25 : 22,
          ),
    );

    return Container(
      alignment: Alignment.center,
      height: height,
      width: height,
      decoration: BoxDecoration(
        border: hasBorder == true
            ? Border.all(
                color: Theme.of(context).textTheme.headlineLarge?.color ??
                    Colors.white,
                width: 3,
              )
            : null,
        shape: BoxShape.circle,
        color: backgroundColor ?? randomColor,
      ),
      child: child,
    );
  }

  static String getInitials(String string, {int limitTo = 2}) {
    final buffer = StringBuffer();
    final wordList = string.trim().split(' ');

    if (string.isEmpty) {
      return string;
    }
    if (wordList.length <= 1) {
      return string.characters.first;
    }
    if (limitTo > wordList.length) {
      for (var i = 0; i < wordList.length; i++) {
        buffer.write(wordList[i][0]);
      }
      return buffer.toString();
    }

    for (var i = 0; i < limitTo; i++) {
      buffer.write(wordList[i][0]);
    }
    return buffer.toString().toUpperCase();
  }
}
