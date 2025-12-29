import 'package:gl_horses/l10n/gen_l10n/app_localizations.dart';
import 'package:models/models.dart';

extension AccountTypeExt on AccountType {
  String toLabel(AppLocalizations l10n) {
    switch (this) {
      case AccountType.owner:
        return l10n.owner;
      case AccountType.manager:
        return l10n.manager;
      case AccountType.boarder:
        return l10n.boarder;
      case AccountType.groomer:
        return l10n.groomer;
      case AccountType.admin:
        return l10n.admin;
    }
  }
}
