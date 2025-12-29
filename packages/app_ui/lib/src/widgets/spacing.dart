// ignore_for_file: public_member_api_docs

import 'package:flutter/material.dart';

class Height extends StatelessWidget {
  const Height(this.size, {super.key});
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(key: key, height: size);
  }
}

class Width extends StatelessWidget {
  const Width(this.size, {super.key});
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(key: key, width: size);
  }
}
