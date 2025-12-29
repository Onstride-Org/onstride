import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ValidateEmailScreen extends ConsumerStatefulWidget {
  const ValidateEmailScreen({super.key});
    static const path = '/validate-email';
  static const name = 'validate-email';
  @override
  ConsumerState<ValidateEmailScreen> createState() => _ValidateEmailScreenState();
}

class _ValidateEmailScreenState extends ConsumerState<ValidateEmailScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ValidateEmailScreen'),
      ),
      body: const Center(
        child: Text('ValidateEmailScreen content'),
      ),
    );
  }
}