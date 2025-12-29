import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

/// A reusable birthdate input using three GLDropdowns (Month, Day, Year).
///
/// Rules:
/// - Month and Day default to January (ENE) and 1st (01).
/// - Users may manually change Month and Day at any time to set the exact birthdate.
/// - If the user modifies Month or Day, the app treats the date as an exact birthdate.
/// - If the user only selects Year and does not modify Month/Day, the date is saved
///   as January 1st of that year.
/// - If no Year is selected, the widget emits `null` and Month/Day are disabled
///   (so visually "nothing appears" as a selected birthdate).
class BirthdateInput extends StatefulWidget {
  const BirthdateInput({
    super.key,
    this.initialDate,
    this.onChanged,
    this.enabled = true,
    this.monthLabel = 'Month',
    this.dayLabel = 'Day',
    this.yearLabel = 'Year',
    this.minYear = 1900,
    this.maxYear,
  });

  /// Optional initial date. If provided, it is treated as exact.
  final DateTime? initialDate;

  /// Called whenever the derived date changes.
  /// [date] is null if Year is not selected yet.
  /// [isExact] is true when Month or Day were modified, or when initialDate exists.
  final void Function(DateTime? date, bool isExact)? onChanged;

  final bool enabled;

  final String monthLabel;
  final String dayLabel;
  final String yearLabel;

  final int minYear;
  final int? maxYear;

  @override
  State<BirthdateInput> createState() => _BirthdateInputState();
}

class _BirthdateInputState extends State<BirthdateInput> {
  static const int _defaultMonth = 1;
  static const int _defaultDay = 1;

  static const List<String> _monthAbbr = <String>[
    'ENE',
    'FEB',
    'MAR',
    'ABR',
    'MAY',
    'JUN',
    'JUL',
    'AGO',
    'SEP',
    'OCT',
    'NOV',
    'DIC',
  ];

  late int _month;
  late int _day;
  int? _year;

  bool _monthTouched = false;
  bool _dayTouched = false;

  int get _maxYear => widget.maxYear ?? DateTime.now().year;

  @override
  void initState() {
    super.initState();

    final initial = widget.initialDate;
    if (initial != null) {
      _month = initial.month;
      _day = initial.day;
      _year = initial.year;

      // If we have an initial date, we assume it is exact.
      _monthTouched = true;
      _dayTouched = true;
    } else {
      _month = _defaultMonth;
      _day = _defaultDay;
      _year = null;
    }

    if (initial != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _emit());
    }
  }

  void _emit() {
    widget.onChanged?.call(_currentDateOrNull(), _isExact);
  }

  bool get _isExact => _monthTouched || _dayTouched;

  String _monthLabel(int month) => _monthAbbr[month - 1];

  int _daysInMonth({
    required int year,
    required int month,
  }) {
    return DateTime(year, month + 1, 0).day;
  }

  DateTime? _currentDateOrNull() {
    // If no year, we don't have a usable birthday.
    if (_year == null) return null;

    // If user never touched month/day, save as Jan 1st of the chosen year.
    final month = _isExact ? _month : _defaultMonth;
    final day = _isExact ? _day : _defaultDay;

    final maxDay = _daysInMonth(year: _year!, month: month);
    final safeDay = day.clamp(1, maxDay);

    return DateTime(_year!, month, safeDay);
  }

  void _onMonthChanged(int value) {
    if (!widget.enabled) return;
    if (_year == null)
      return; // Keep month/day inactive until year is selected.

    setState(() {
      _monthTouched = true;
      _month = value;

      final maxDay = _daysInMonth(year: _year!, month: _month);
      if (_day > maxDay) _day = maxDay;
    });

    _emit();
  }

  void _onDayChanged(int value) {
    if (!widget.enabled) return;
    if (_year == null) return;

    setState(() {
      _dayTouched = true;
      _day = value;
    });

    _emit();
  }

  void _onYearChanged(int value) {
    if (!widget.enabled) return;

    setState(() {
      _year = value;

      final maxDay = _daysInMonth(year: _year!, month: _month);
      if (_day > maxDay) _day = maxDay;
    });

    _emit();
  }

  String _twoDigits(int v) => v.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    final enabled = widget.enabled;

    final years = List<int>.generate(
      _maxYear - widget.minYear + 1,
      (i) => widget.minYear + i,
    ).reversed.toList(); // newest first

    // Month/Day should be disabled until a Year is selected.
    final monthDayEnabled = enabled && _year != null;

    // We still build months/days, but we disable interaction (IgnorePointer in GLDropdown)
    // and show hint labels. Selected value is set to null to show "nothing" until year exists.
    final months = List<int>.generate(12, (i) => i + 1);

    final daysCount = _year == null
        ? 31
        : _daysInMonth(year: _year!, month: _month);
    final days = List<int>.generate(daysCount, (i) => i + 1);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 5,
          child: GLDropdown<int>(
            enabled: monthDayEnabled,
            label: Text(widget.monthLabel, style: context.bodySmall),
            hintLabel: 'MM',
            items: months,
            selectedValue: _year == null ? null : _month,
            onChanged: _onMonthChanged,
            itemBuilder: (m) => Text(_monthLabel(m)),
            selectedItemBuilder: (m) => Text(_monthLabel(m)),
          ),
        ),
        GLSpaces.px12,
        Expanded(
          flex: 4,
          child: GLDropdown<int>(
            enabled: monthDayEnabled,
            label: Text(widget.dayLabel, style: context.bodySmall),
            hintLabel: 'DD',
            items: days,
            selectedValue: _year == null ? null : _day.clamp(1, daysCount),
            onChanged: _onDayChanged,
            itemBuilder: (d) => Text(_twoDigits(d)),
            selectedItemBuilder: (d) => Text(_twoDigits(d)),
          ),
        ),
        GLSpaces.px12,
        Expanded(
          flex: 5,
          child: GLDropdown<int>(
            enabled: enabled,
            label: Text(widget.yearLabel, style: context.bodySmall),
            hintLabel: 'YYYY',
            items: years,
            selectedValue: _year,
            onChanged: _onYearChanged,
            itemBuilder: (y) => Text(y.toString()),
            selectedItemBuilder: (y) => Text(y.toString()),
          ),
        ),
      ],
    );
  }
}
