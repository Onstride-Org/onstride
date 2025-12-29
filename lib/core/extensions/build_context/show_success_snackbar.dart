import 'package:app_ui/app_ui.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

extension ShowErrorOrSuccessSnackbarX on BuildContext {
  void showSuccess({
    required String title,
    String? subtitle,
    int seconds = 5,
    AppSnackBarAction? action,
  }) {
    return showSnackBar(
      AppSnackBar.success(
        title: title,
        subtitle: subtitle,
        action: action,
      ),
      seconds: seconds,
    );
  }

  void showError({
    required String title,
    String? subtitle,
    int seconds = 5,
    AppSnackBarAction? action,
    bool showClose = true,
  }) {
    return showSnackBar(
      AppSnackBar.error(
        title: title,
        subtitle: subtitle,
        action: action,
        showClose: showClose,
      ),
      seconds: seconds,
    );
  }
}

extension ShowErrorOrSuccessSnackbarScafoldX
    on GlobalKey<ScaffoldMessengerState> {
  void showSuccess({
    required String title,
    String? subtitle,
    int seconds = 5,
    AppSnackBarAction? action,
  }) {
    return showSnackBarFromCurrentState(
      AppSnackBar.success(
        title: title,
        subtitle: subtitle,
        action: action,
      ),
      seconds: seconds,
    );
  }

  void showError({
    required String title,
    String? subtitle,
    int seconds = 5,
    AppSnackBarAction? action,
    bool showClose = true,
  }) {
    return showSnackBarFromCurrentState(
      AppSnackBar.error(
        title: title,
        subtitle: subtitle,
        action: action,
        showClose: showClose,
      ),
      seconds: seconds,
    );
  }
}
