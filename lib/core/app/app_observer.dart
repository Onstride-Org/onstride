import 'dart:developer';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/features.dart';

class AppProviderObserver extends ProviderObserver {
  @override
  void didUpdateProvider(
    ProviderBase provider,
    Object? previousValue,
    Object? newValue,
    ProviderContainer container,
  ) {
    if ('$previousValue'.startsWith('FetchHorses')) {
      final state = newValue as FetchHorsesState;
      log('New value ${state.horses.length}');
      // log('Old value: $previousValue');
      // log('New value: $newValue');
    }
  }

  @override
  void didAddProvider(
    ProviderBase provider,
    Object? value,
    ProviderContainer container,
  ) {
    log('[PROVIDER ADDED] → ${provider.name ?? provider.runtimeType}');
  }

  @override
  void didDisposeProvider(
    ProviderBase provider,
    ProviderContainer container,
  ) {
    // log('[PROVIDER DISPOSED] → ${provider.name ?? provider.runtimeType}');
  }
}
