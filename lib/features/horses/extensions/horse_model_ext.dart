import 'package:flutter/material.dart';
import 'package:gl_horses/l10n/gen_l10n/app_localizations.dart';
import 'package:models/models.dart';

extension HorseStatusExt on HorseStatus {
  Color? get statusColor {
    if (this == HorseStatus.active) {
      return Colors.green.shade100;
    }

    if (this == HorseStatus.inactive) {
      return Colors.red.shade100;
    }

    return null;
  }

  Color? get statusFontColor {
    if (this == HorseStatus.active) {
      return Colors.green.shade800;
    }

    if (this == HorseStatus.inactive) {
      return Colors.red.shade800;
    }

    return null;
  }

  String label(AppLocalizations l10n) {
    return switch (this) {
      HorseStatus.active => l10n.active,
      HorseStatus.inactive => l10n.inactive,
      null => l10n.indefinite,
    };
  }
}

extension HorseModelExt on HorseModel {
  String ageLabel(AppLocalizations l10n) {
    final birthdate = birthday;
    final now = DateTime.now();

    if (birthdate.isAfter(now)) {
      return l10n.invalidDate;
    }

    final diff = now.difference(birthdate);
    final years = (diff.inDays / 365).floor();
    final months = (diff.inDays / 30).floor();

    if (years >= 1) {
      return l10n.ageYears(years);
    } else if (months >= 1) {
      return l10n.ageMonths(months);
    } else {
      return l10n.newborn;
    }
  }
}
