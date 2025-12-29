import 'package:app_ui/app_ui.dart';
import 'package:auth_repository/auth_repository.dart';
import 'package:authentication_client/authentication_client.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:flutter/cupertino.dart';
import 'package:gl_horses/core/extensions/exceptions/exceptions.dart';
import 'package:gl_horses/l10n/l10n.dart';

extension ShowExceptionSnackbarX on BuildContext {
  void showAuthException(AuthenticationException exception) {
    return showSnackBar(
      AppSnackBar.error(
        title: exception.title(l10n),
        subtitle: exception.description(l10n),
      ),
    );
  }

  void showDataException(
    DataProviderException exception, {
    String? title,
    String? description,
  }) {
    return showSnackBar(
      AppSnackBar.error(
        title: title ?? exception.name(l10n),
        subtitle: description ?? exception.description(l10n),
      ),
    );
  }
}
