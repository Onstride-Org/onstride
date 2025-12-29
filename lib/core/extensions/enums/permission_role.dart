import 'package:gl_horses/l10n/gen_l10n/app_localizations.dart';
import 'package:models/models.dart';

extension PermissionRoleExt on PermissionRole {
  String toLabel(AppLocalizations l10n) {
    switch (this) {
      case PermissionRole.userManagement:
        return l10n.userManagement;
      case PermissionRole.horseManagement:
        return l10n.horseManagement;
      case PermissionRole.barnManagement:
        return l10n.stableManagement;
      case PermissionRole.generateInvoices:
        return l10n.generateInvoices;
    }
  }
}
