// ignore_for_file: public_member_api_docs

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

class AppCircleAvatar extends StatefulWidget {
  const AppCircleAvatar({
    super.key,
    this.height = 18,
    this.iconSize = 15,
    this.hasBorder = false,
    this.hasElevation = true,
    this.onTap,
    this.fontColor,
    this.backgroundColor,
    this.fullName,
    this.avatarUrl,
  });
  final double height;
  final double iconSize;
  final dynamic Function()? onTap;
  final String? avatarUrl;
  final String? fullName;
  final Color? fontColor;
  final Color? backgroundColor;
  final bool? hasBorder;
  final bool? hasElevation;

  @override
  State<AppCircleAvatar> createState() => _EcCircleAvatarState();
}

class _EcCircleAvatarState extends State<AppCircleAvatar> {
  bool error = false;

  @override
  Widget build(BuildContext context) {
    try {
      if (error ||
          widget.avatarUrl == null ||
          widget.avatarUrl == '' ||
          widget.avatarUrl == 'images?prefix=users&image_id=' ||
          widget.avatarUrl?.contains('none') == true) {
        return InitialsAvatar(
          height: widget.height,
          iconSize: widget.iconSize,
          hasBorder: widget.hasBorder,
          hasElevation: widget.hasElevation,
          fontColor: widget.fontColor,
          backgroundColor: widget.backgroundColor,
          fullName: widget.fullName,
          avatarUrl: widget.avatarUrl,
        );
      } else {
        return Container(
          width: widget.height,
          height: widget.height,
          decoration: BoxDecoration(
            border: widget.hasBorder == true
                ? Border.all(color: Colors.white, width: 3)
                : null,
            color: Theme.of(context).colorScheme.primary,
            shape: BoxShape.circle,
            // image: DecorationImage(
            //   image: AssetImage(Assets.icons.google.path),
            // ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(10000),
            child: Image.network(
              widget.avatarUrl ?? '',
              fit: BoxFit.cover,
            ),
          ),
        );
      }
    } catch (err) {
      return InitialsAvatar(
        height: widget.height,
        iconSize: widget.iconSize,
        hasBorder: widget.hasBorder,
        hasElevation: widget.hasElevation,
        fontColor: widget.fontColor,
        backgroundColor: widget.backgroundColor,
        fullName: widget.fullName,
        avatarUrl: widget.avatarUrl,
      );
    }
  }
}
