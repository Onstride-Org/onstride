import 'package:flutter/material.dart';

class WebViewWrapper {
  void loadUrl(String url) {
    // No-op on web - use url_launcher instead
  }

  Widget buildWidget() {
    return const SizedBox.shrink();
  }
}
