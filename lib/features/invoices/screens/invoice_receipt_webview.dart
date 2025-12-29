import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class WebViewWrapper {
  WebViewWrapper() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.transparent);
  }

  late final WebViewController _controller;

  void loadUrl(String url) {
    _controller.loadRequest(Uri.parse(url));
  }

  Widget buildWidget() {
    return WebViewWidget(controller: _controller);
  }
}
