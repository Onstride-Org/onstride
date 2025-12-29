import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:table_calendar/table_calendar.dart';

/// GLCalendarDatePicker
/// Reusable bottom-sheet date picker using table_calendar with
/// month/year dropdowns and chevrons. Returns a picked DateTime at 00:00.
class GLCalendarDatePicker {
  /// Opens the calendar picker and returns the selected date or null if canceled.
  static Future<DateTime?> show(
    BuildContext context, {
    DateTime? initialDate,
    DateTime? minDate,
    DateTime? maxDate,
    List<String>? monthNames,
    List<int>? years,
  }) async {
    final DateTime today = _atStartOfDay(DateTime.now());
    final DateTime _max = _atStartOfDay(maxDate ?? today);
    final DateTime _min = _atStartOfDay(minDate ?? DateTime(2000, 1, 1));
    final DateTime _initial = _clampDate(
      _atStartOfDay(initialDate ?? today),
      _min,
      _max,
    );

    final List<String> _months =
        monthNames ??
        const [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];

    // Default years list around min..max (inclusive).
    final List<int> _years =
        years ??
        List<int>.generate(
          (_max.year - _min.year) + 1,
          (i) => _min.year + i,
        );

    return showModalBottomSheet<DateTime>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return SafeArea(
          child: Center(
            child: _CalendarSheet(
              initialDate: _initial,
              minDate: _min,
              maxDate: _max,
              monthNames: _months,
              years: _years,
            ),
          ),
        );
      },
    );
  }

  static DateTime _atStartOfDay(DateTime d) => DateTime(d.year, d.month, d.day);

  static DateTime _clampDate(DateTime value, DateTime min, DateTime max) {
    if (value.isBefore(min)) return min;
    if (value.isAfter(max)) return max;
    return value;
  }
}

class _CalendarSheet extends StatefulWidget {
  const _CalendarSheet({
    required this.initialDate,
    required this.minDate,
    required this.maxDate,
    required this.monthNames,
    required this.years,
  });

  final DateTime initialDate;
  final DateTime minDate;
  final DateTime maxDate;
  final List<String> monthNames;
  final List<int> years;

  @override
  State<_CalendarSheet> createState() => _CalendarSheetState();
}

class _CalendarSheetState extends State<_CalendarSheet> {
  late DateTime _focused;
  DateTime? _selected;

  @override
  void initState() {
    super.initState();
    _focused = widget.initialDate;
    _selected = widget.initialDate;
  }

  void _prevMonth() {
    setState(() {
      _focused = DateTime(_focused.year, _focused.month - 1, _focused.day);
      _focused = _boundedFocus(_focused);
    });
  }

  void _nextMonth() {
    setState(() {
      _focused = DateTime(_focused.year, _focused.month + 1, _focused.day);
      _focused = _boundedFocus(_focused);
    });
  }

  void _prevYear() {
    setState(() {
      _focused = DateTime(_focused.year - 1, _focused.month, _focused.day);
      _focused = _boundedFocus(_focused);
    });
  }

  void _nextYear() {
    setState(() {
      _focused = DateTime(_focused.year + 1, _focused.month, _focused.day);
      _focused = _boundedFocus(_focused);
    });
  }

  DateTime _boundedFocus(DateTime d) {
    if (d.isBefore(widget.minDate)) return widget.minDate;
    if (d.isAfter(widget.maxDate)) return widget.maxDate;
    return d;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: 16.edgeInsetsA,
      padding: [12, 8, 12, 12].edgeInsetsLTRB,
      decoration: BoxDecoration(
        color: theme.canvasColor,
        borderRadius: 16.borderRadiusA,
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 24)],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          /// Header: month and year controls
          Row(
            children: [
              InkWell(
                onTap: _prevMonth,
                child: const Icon(Icons.chevron_left),
              ),
              Expanded(
                flex: 7,
                child: GLDropdown<String>(
                  items: widget.monthNames,
                  selectedValue: widget.monthNames[_focused.month - 1],
                  hintLabel: 'Month',
                  hasBorder: false,
                  buttonPadding: EdgeInsets.zero,
                  onChanged: (String m) {
                    final idx = widget.monthNames.indexOf(m) + 1;
                    setState(() {
                      _focused = DateTime(_focused.year, idx, _focused.day);
                      _focused = _boundedFocus(_focused);
                    });
                  },
                  // Render for each option inside the dropdown.
                  itemBuilder: (String m) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(m),
                  ),
                  // Render for the selected value when the dropdown is closed.
                  selectedItemBuilder: (String m) => Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      m,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ),
              ),
              InkWell(
                onTap: _nextMonth,
                child: const Icon(Icons.chevron_right),
              ),
              const SizedBox(width: 12),
              InkWell(
                onTap: _prevYear,
                child: const Icon(Icons.chevron_left),
              ),
              Expanded(
                flex: 5,
                child: GLDropdown<int>(
                  items: widget.years,
                  hasBorder: false,
                  buttonPadding: EdgeInsets.zero,
                  selectedValue: _focused.year,
                  hintLabel: 'Year',
                  onChanged: (int y) {
                    setState(() {
                      _focused = DateTime(y, _focused.month, _focused.day);
                      _focused = _boundedFocus(_focused);
                    });
                  },
                  // How each option looks inside the dropdown modal.
                  itemBuilder: (int y) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10.0),
                    child: Text('$y'),
                  ),
                  // How the selected item looks when the dropdown is closed.
                  selectedItemBuilder: (int y) => Text(
                    '$y',
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ),
              InkWell(
                onTap: _nextYear,
                child: const Icon(Icons.chevron_right),
              ),
            ],
          ),
          GLSpaces.px24,
          TableCalendar<DateTime>(
            rowHeight: 45,
            firstDay: widget.minDate,
            lastDay: widget.maxDate,
            focusedDay: _focused,
            headerVisible: false,
            availableGestures: AvailableGestures.none,
            daysOfWeekHeight: 50,
            selectedDayPredicate: (d) => isSameDay(_selected, d),
            onDaySelected: (sel, foc) {
              setState(() {
                _selected = DateTime(sel.year, sel.month, sel.day);
                _focused = foc;
              });
            },
            onPageChanged: (foc) {
              setState(() => _focused = foc);
            },
            calendarStyle: CalendarStyle(
              todayTextStyle: TextStyle(
                color: theme.colorScheme.primary,
              ),
              selectedDecoration: BoxDecoration(
                color: theme.colorScheme.primary,
                shape: BoxShape.circle,
              ),
              todayDecoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: theme.colorScheme.primary,
                ),
              ),
            ),
          ),

          const SizedBox(height: 12),

          /// Actions
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                style: TextButton.styleFrom(
                  foregroundColor: GLColors.errorSwatch,
                  padding: const EdgeInsets.symmetric(
                    vertical: 4,
                    horizontal: 32,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(context.l10n.cancel),
              ),
              GLSpaces.px8,
              ElevatedButton(
                onPressed: _selected == null
                    ? null
                    : () => Navigator.pop(context, _selected),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    vertical: 4,
                    horizontal: 32,
                  ),
                ),
                child: Text(
                  context.l10n.ok,
                  style: const TextStyle(fontWeight: FontWeight.normal),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
