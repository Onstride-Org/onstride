import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/core/common/dialogs/calendar_date_picker.dart';
import 'package:gl_horses/l10n/l10n.dart';

/// GLCalendarDateTimePicker
/// Reusable bottom-sheet date and time picker that combines
/// date selection with time selection in a two-step process.
/// Returns a picked DateTime with both date and time.
class GLCalendarDateTimePicker {
  static Future<DateTime?> show(
    BuildContext context, {
    DateTime? initialDate,
    DateTime? minDate,
    DateTime? maxDate,
    List<String>? monthNames,
    List<int>? years,
  }) async {
    final today = DateTime.now();
    final max = maxDate ?? DateTime(3000);
    final min = minDate ?? DateTime(2000);
    final initial = _clampDate(
      initialDate ?? today,
      min,
      max,
    );

    final selectedDate = await GLCalendarDatePicker.show(
      context,
      initialDate: initial,
      minDate: min,
      maxDate: max,
      monthNames: monthNames,
      years: years,
    );

    if (selectedDate == null || !context.mounted) return null;
    final selectedTime = await showTimePicker(
      context: context,
      helpText: context.l10n.setTimeForDueDate,
      cancelText: context.l10n.cancel,
      confirmText: context.l10n.ok,
      initialTime: TimeOfDay.fromDateTime(initial),
      builder: (context, child) {
        final theme = Theme.of(context);
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            alwaysUse24HourFormat: false,
          ),
          child: Theme(
            data: theme.copyWith(
              timePickerTheme: TimePickerThemeData(
                backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                hourMinuteColor: GLColors.brand50,
                cancelButtonStyle: GLButtonStyles.errorLinkM.copyWith(
                  padding: WidgetStateProperty.all<EdgeInsetsGeometry>(
                    32.edgeInsetsH,
                  ),
                ),
                confirmButtonStyle: GLButtonStyles.primaryM.copyWith(
                  padding: WidgetStateProperty.all<EdgeInsetsGeometry>(
                    const EdgeInsets.symmetric(horizontal: 32),
                  ),
                ),
              ),
            ),
            child: child!,
          ),
        );
      },
    );

    if (selectedTime == null) return null;

    return DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
      selectedTime.hour,
      selectedTime.minute,
    );
  }

  static DateTime _clampDate(DateTime value, DateTime min, DateTime max) {
    if (value.isBefore(min)) return min;
    if (value.isAfter(max)) return max;
    return value;
  }
}
